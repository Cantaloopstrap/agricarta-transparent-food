import pino from 'pino';
import { supabase } from '../config/supabase.js';

const logger = pino({ level: 'info' });

// Clean and format phone number to 628...
function formatPhoneNumber(phone) {
  let cleaned = (phone || '').toString().replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * POST /api/persona-sync
 * Webhook controller receiving distributor persona ratings from Google Form / Apps Script
 */
export async function syncPersona(req, res) {
  try {
    // 1. Security Gatekeeper: Verify Authorization Header against WEBHOOK_SECRET_KEY
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.WEBHOOK_SECRET_KEY || 'agrikarta_persona_secret_key_2026';

    if (!authHeader) {
      logger.warn('Persona webhook request missing Authorization header');
      return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (token !== expectedSecret) {
      logger.warn({ providedToken: token }, 'Persona webhook unauthorized: Secret key mismatch');
      return res.status(401).json({ error: 'Unauthorized: Invalid Webhook Secret Key' });
    }

    // 2. Data Ingestion & Sanitization
    const { distributor_phone, distributor_name, scores } = req.body;

    if (!distributor_phone || !distributor_name) {
      return res.status(400).json({ error: 'distributor_phone and distributor_name are required' });
    }

    const formattedPhone = formatPhoneNumber(distributor_phone);

    // Extract score values (supports nested scores object or flat request body)
    const rawKualitas = scores?.kualitas ?? req.body.score_kualitas ?? req.body.kualitas;
    const rawDisiplin = scores?.disiplin ?? req.body.score_disiplin ?? req.body.disiplin;
    const rawSikap = scores?.sikap ?? req.body.score_sikap ?? req.body.sikap;
    const rawKejujuran = scores?.kejujuran ?? req.body.score_kejujuran ?? req.body.kejujuran;

    const kualitas = parseFloat(rawKualitas);
    const disiplin = parseFloat(rawDisiplin);
    const sikap = parseFloat(rawSikap);
    const kejujuran = parseFloat(rawKejujuran);

    if (isNaN(kualitas) || isNaN(disiplin) || isNaN(sikap) || isNaN(kejujuran)) {
      return res.status(400).json({ error: 'Scores must be valid numbers for kualitas, disiplin, sikap, and kejujuran' });
    }

    // 3. Score Calculation
    const avg_score = parseFloat(((kualitas + disiplin + sikap + kejujuran) / 4).toFixed(2));

    // 4. Database UPSERT Mutation on distributors table
    const payload = {
      phone: formattedPhone,
      name: distributor_name,
      score_kualitas: kualitas,
      score_disiplin: disiplin,
      score_sikap: sikap,
      score_kejujuran: kejujuran,
      avg_score: avg_score,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('distributors')
      .upsert(payload, { onConflict: 'phone' })
      .select();

    if (error) {
      logger.error({ error, payload }, 'Failed to upsert distributor persona in Supabase');
      return res.status(500).json({ error: 'Database upsert failed' });
    }

    logger.info({ formattedPhone, distributor_name, avg_score }, 'Distributor persona rating synchronized successfully');

    return res.status(200).json({
      success: true,
      message: 'Distributor persona synchronized successfully',
      data: data ? data[0] : payload
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error in syncPersona controller');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
