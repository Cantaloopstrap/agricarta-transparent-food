import midtransClient from 'midtrans-client';
import jwt from 'jsonwebtoken';
import pino from 'pino';
import { supabase } from '../config/supabase.js';
import { getWASocket } from '../bot/waConnection.js';

const logger = pino({ level: 'info' });

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-placeholder',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder'
});

// Utility to format phone numbers to standard 628...
function formatPhoneNumber(phone) {
  let cleaned = (phone || '').toString().replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * POST /api/checkout
 * Request Body: { phone: string }
 */
export async function createCheckout(req, res) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const orderId = `PREMIUM-${formattedPhone}-${Date.now()}`;
    const amount = 50000;

    // 1. Insert transaction row into Supabase
    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        order_id: orderId,
        phone: formattedPhone,
        amount: amount,
        status: 'pending'
      });

    if (dbError) {
      logger.error({ dbError }, 'Failed to insert transaction into Supabase');
      return res.status(500).json({ error: 'Database transaction insertion failed.' });
    }

    // 2. Request Midtrans Snap token
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        phone: formattedPhone
      },
      item_details: [
        {
          id: 'PREMIUM_ACCESS',
          price: amount,
          quantity: 1,
          name: 'Agrikarta Premium Subscription'
        }
      ]
    };

    const transaction = await snap.createTransaction(parameter);

    logger.info({ orderId, formattedPhone }, 'Midtrans Snap checkout created successfully');

    return res.status(200).json({
      success: true,
      order_id: orderId,
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error in createCheckout');
    return res.status(500).json({ error: 'Checkout processing failed.' });
  }
}

/**
 * POST /api/midtrans-webhook
 * Midtrans settlement webhook notification handler
 */
export async function handleMidtransWebhook(req, res) {
  try {
    const notification = req.body;
    logger.info({ notification }, 'Received Midtrans Webhook Notification');

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let isSuccess = false;

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        isSuccess = true;
      }
    } else if (transactionStatus === 'settlement') {
      isSuccess = true;
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      await supabase
        .from('transactions')
        .update({ status: 'expire', updated_at: new Date().toISOString() })
        .eq('order_id', orderId);
    }

    if (isSuccess) {
      // 1. Retrieve transaction from database
      const { data: transactionRecord, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      const userPhone = transactionRecord ? transactionRecord.phone : notification.phone || notification.customer_details?.phone;

      // 2. Update transaction status to settlement
      await supabase
        .from('transactions')
        .update({ status: 'settlement', updated_at: new Date().toISOString() })
        .eq('order_id', orderId);

      if (userPhone) {
        const formattedPhone = formatPhoneNumber(userPhone);

        // 3. Update users table: set is_premium = true, premium_until = NOW() + 1 month
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        const { data: userRecord } = await supabase
          .from('users')
          .select('*')
          .eq('phone', formattedPhone)
          .maybeSingle();

        let userRole = 'farmer';

        if (userRecord) {
          userRole = userRecord.role || 'farmer';
          await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_until: oneMonthLater.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('phone', formattedPhone);
        } else {
          await supabase.from('users').insert({
            phone: formattedPhone,
            role: 'farmer',
            is_premium: true,
            premium_until: oneMonthLater.toISOString()
          });
        }

        // 4. Generate Magic Link JWT with 1-hour expiration
        const jwtSecret = process.env.JWT_SECRET || 'agrikarta_super_secret_jwt_key_2026';
        const token = jwt.sign(
          {
            phone: formattedPhone,
            role: userRole,
            tier: 'premium'
          },
          jwtSecret,
          { expiresIn: '1h' }
        );

        const frontendUrl = process.env.FRONTEND_URL || 'https://agrikarta.app';
        const magicLink = `${frontendUrl}/auth?token=${token}`;

        // 5. Send Magic Link via WhatsApp Bot
        const sock = getWASocket();
        if (sock) {
          const jid = `${formattedPhone}@s.whatsapp.net`;
          const waMessage = `Pembayaran sukses! Klik link ini untuk masuk: ${magicLink}`;

          await sock.sendMessage(jid, { text: waMessage }).catch((err) => {
            logger.error({ err: err.message, jid }, 'Failed to send WhatsApp Magic Link');
          });

          logger.info({ formattedPhone, jid }, 'Magic link sent via WhatsApp successfully');
        } else {
          logger.warn('WhatsApp socket not connected. Unable to send Magic Link.');
        }
      }
    }

    return res.status(200).json({ status: 'OK', message: 'Notification processed' });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error in handleMidtransWebhook');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
