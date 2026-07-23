import { downloadMediaMessage } from '@whiskeysockets/baileys';
import pino from 'pino';
import { supabase } from '../config/supabase.js';

const logger = pino({ level: 'info' });

// In-memory user conversation state manager
// Schema: userStates[phone] = { state: string, komoditas?: string, bobot?: number, userId?: string }
const userStates = {};

// Regex pattern to extract harvest details: e.g. "Jagung 500 kg", "Cabai 50kg"
const HARVEST_REGEX = /(?<komoditas>[a-zA-Z\s]+)\s*(?<bobot>\d+(?:\.\d+)?)\s*kg/i;

/**
 * Ensures the 'harvest_images' bucket exists in Supabase Storage.
 */
async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'harvest_images');
    if (!exists) {
      await supabase.storage.createBucket('harvest_images', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      logger.info("Supabase storage bucket 'harvest_images' created.");
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Could not check/create 'harvest_images' bucket");
  }
}

// Call on load
ensureBucketExists();

/**
 * Handles incoming WhatsApp messages from Baileys upsert event
 * @param {import('@whiskeysockets/baileys').WASocket} sock 
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg 
 */
export async function handleIncomingMessage(sock, msg) {
  try {
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    if (!jid || !jid.endsWith('@s.whatsapp.net')) return; // Ignore group chats and status updates

    // Extract clean phone number (e.g. 628123456789)
    const phone = jid.replace(/[^0-9]/g, '');

    // Extract message text content
    const messageText = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      ''
    ).trim();

    const isImage = !!msg.message.imageMessage;

    logger.info({ phone, messageText, isImage }, 'Processing incoming WhatsApp message');

    // 1. Query user from Supabase users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, status_active, role')
      .eq('phone', phone)
      .maybeSingle();

    if (userError) {
      logger.error({ userError, phone }, 'Database error querying user from Supabase');
    }

    // Check if user is banned
    if (user && user.status_active === false) {
      await sock.sendMessage(jid, {
        text: '❌ Akun Anda telah dinonaktifkan oleh administrator. Anda tidak dapat membuat laporan panen.'
      });
      return;
    }

    // 2. Auto-Registration Flow (Gatekeeper)
    if (!user) {
      const currentState = userStates[phone]?.state;

      if (currentState !== 'WAITING_FOR_NAME') {
        userStates[phone] = { state: 'WAITING_FOR_NAME' };
        await sock.sendMessage(jid, {
          text: 'Halo! Anda belum terdaftar di Agrikarta.\n\nBalas dengan *NAMA_LENGKAP* Anda untuk mendaftar.'
        });
        return;
      } else {
        if (!messageText || isImage) {
          await sock.sendMessage(jid, {
            text: 'Silakan kirimkan nama lengkap Anda berupa teks untuk mendaftar.'
          });
          return;
        }

        const fullName = messageText;
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            phone,
            full_name: fullName,
            role: 'farmer',
            status_active: true
          })
          .select('id, full_name')
          .single();

        if (insertError) {
          logger.error({ insertError, phone }, 'Failed to register new user');
          await sock.sendMessage(jid, {
            text: 'Maaf, terjadi kesalahan saat melakukan registrasi. Silakan coba lagi.'
          });
          return;
        }

        delete userStates[phone];
        await sock.sendMessage(jid, {
          text: `🎉 Selamat *${newUser.full_name}*! Pendaftaran Anda di Agrikarta berhasil.\n\nUntuk melaporkan hasil panen, silakan ketik dengan format:\n*[Nama Komoditas] [Angka] kg*\nContoh: *Cabai 50 kg*`
        });
        return;
      }
    }

    // 3. User Registered: Harvest Ingestion Flow

    // A. Handle Image Upload when in WAITING_FOR_PHOTO state
    if (isImage) {
      const stateObj = userStates[phone];
      if (stateObj && stateObj.state === 'WAITING_FOR_PHOTO') {
        try {
          await sock.sendMessage(jid, { text: '⏳ Mengunduh dan memproses foto timbangan...' });

          // Download media buffer from Baileys
          const buffer = await downloadMediaMessage(msg, 'buffer', {});

          const timestamp = Date.now();
          const cleanCommodity = stateObj.komoditas.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const fileName = `harvest_${cleanCommodity}_${timestamp}.jpg`;

          // Upload image buffer to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('harvest_images')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            logger.error({ uploadError, phone }, 'Supabase storage image upload failed');
            await sock.sendMessage(jid, {
              text: '⚠️ Gagal mengunggah foto. Simpan foto Anda dan laporkan kembali dalam 10 menit.'
            });
            delete userStates[phone];
            return;
          }

          // Generate Public URL
          const { data: urlData } = supabase.storage
            .from('harvest_images')
            .getPublicUrl(fileName);

          const proofImageUrl = urlData ? urlData.publicUrl : null;

          // Insert record into harvest_reports table
          const { error: reportError } = await supabase
            .from('harvest_reports')
            .insert({
              user_id: user.id,
              commodity_name: stateObj.komoditas,
              weight_kg: stateObj.bobot,
              proof_image_url: proofImageUrl
            });

          if (reportError) {
            logger.error({ reportError, phone }, 'Failed to insert harvest report into Supabase');
            await sock.sendMessage(jid, {
              text: 'Maaf, gagal menyimpan laporan panen ke database. Silakan coba lagi.'
            });
            delete userStates[phone];
            return;
          }

          // Clear state & send success confirmation
          delete userStates[phone];
          await sock.sendMessage(jid, {
            text: `✅ *Laporan Panen Berhasil Dicatat!*\n\n• Komoditas: ${stateObj.komoditas}\n• Bobot: ${stateObj.bobot} kg\n• Bukti Foto: Terverifikasi\n\nTerima kasih!`
          });
          return;
        } catch (err) {
          logger.error({ err: err.message, stack: err.stack }, 'Error processing image harvest report');
          await sock.sendMessage(jid, {
            text: 'Sistem sedang sibuk. Simpan foto Anda dan laporkan kembali dalam beberapa menit.'
          });
          delete userStates[phone];
          return;
        }
      }
    }

    // B. Handle Text Message (Regex Extraction)
    if (messageText) {
      const match = messageText.match(HARVEST_REGEX);

      if (!match) {
        await sock.sendMessage(jid, {
          text: 'Format salah. Untuk lapor panen, ketik:\n*[Nama Komoditas] [Angka] kg*\nContoh: *Cabai 50 kg*'
        });
        return;
      }

      const komoditasRaw = match.groups.komoditas.trim();
      const bobotRaw = match.groups.bobot.trim();

      const komoditas = komoditasRaw.charAt(0).toUpperCase() + komoditasRaw.slice(1).toLowerCase();
      const bobot = parseFloat(bobotRaw);

      if (isNaN(bobot) || bobot <= 0) {
        await sock.sendMessage(jid, {
          text: 'Jumlah bobot kg harus berupa angka positif yang valid.'
        });
        return;
      }

      // Save state: WAITING_FOR_PHOTO
      userStates[phone] = {
        state: 'WAITING_FOR_PHOTO',
        komoditas,
        bobot,
        userId: user.id
      };

      await sock.sendMessage(jid, {
        text: `Kirimkan foto timbangan untuk ${komoditas}`
      });
      return;
    }
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Unhandled error in handleIncomingMessage');
  }
}
