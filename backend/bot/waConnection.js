import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleIncomingMessage } from './botController.js';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFolder = path.join(__dirname, 'auth_info_baileys');

const logger = pino({ level: 'info' });

// ─── Connection State Machine ───────────────────────────────────────────────
// States: IDLE → CONNECTING → CONNECTED → RECONNECTING → PERMANENTLY_DISCONNECTED
let connectionState = 'IDLE';
let sock;
let reconnectAttempt = 0;

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY_MS = 2000;       // 2 seconds initial delay
const MAX_DELAY_MS = 60000;       // 60 seconds cap
const JITTER_FACTOR = 0.3;        // ±30% jitter

const SUPABASE_SESSION_BUCKET = 'wa_session_backup';
const SUPABASE_SESSION_PATH = 'auth_session';

// ─── Exponential Backoff with Jitter ────────────────────────────────────────
function calculateBackoffDelay(attempt) {
  const exponentialDelay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  const jitter = exponentialDelay * JITTER_FACTOR * (Math.random() * 2 - 1); // ±30%
  return Math.max(BASE_DELAY_MS, Math.round(exponentialDelay + jitter));
}

// ─── Supabase Session Persistence ───────────────────────────────────────────

/**
 * Ensures the wa_session_backup bucket exists in Supabase Storage.
 */
async function ensureSessionBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === SUPABASE_SESSION_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(SUPABASE_SESSION_BUCKET, {
        public: false,
        fileSizeLimit: 5242880 // 5MB
      });
      logger.info(`Supabase storage bucket '${SUPABASE_SESSION_BUCKET}' created.`);
    }
  } catch (err) {
    logger.warn({ err: err.message }, `Could not check/create '${SUPABASE_SESSION_BUCKET}' bucket`);
  }
}

/**
 * Backup local auth_info_baileys files to Supabase Storage.
 * Called after every creds.update event.
 */
async function backupSessionToSupabase() {
  try {
    if (!fs.existsSync(authFolder)) return;

    const files = fs.readdirSync(authFolder);
    if (files.length === 0) return;

    for (const fileName of files) {
      const filePath = path.join(authFolder, fileName);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const fileBuffer = fs.readFileSync(filePath);
      const remotePath = `${SUPABASE_SESSION_PATH}/${fileName}`;

      await supabase.storage
        .from(SUPABASE_SESSION_BUCKET)
        .upload(remotePath, fileBuffer, {
          contentType: 'application/octet-stream',
          upsert: true
        });
    }

    logger.info(`Session backup to Supabase completed (${files.length} files).`);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to backup WA session to Supabase');
  }
}

/**
 * Restore auth_info_baileys from Supabase Storage if local folder is empty.
 * Called once during startup before initializing the socket.
 */
async function restoreSessionFromSupabase() {
  try {
    // Only restore if local auth folder is empty or doesn't exist
    if (fs.existsSync(authFolder)) {
      const localFiles = fs.readdirSync(authFolder).filter(f => !f.startsWith('.'));
      if (localFiles.length > 0) {
        logger.info('Local session files found. Skipping Supabase restore.');
        return;
      }
    }

    const { data: remoteFiles, error: listError } = await supabase.storage
      .from(SUPABASE_SESSION_BUCKET)
      .list(SUPABASE_SESSION_PATH, { limit: 100 });

    if (listError || !remoteFiles || remoteFiles.length === 0) {
      logger.info('No remote session backup found in Supabase. Fresh QR scan required.');
      return;
    }

    // Ensure local auth folder exists
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    let restoredCount = 0;
    for (const file of remoteFiles) {
      if (!file.name || file.name === '.emptyFolderPlaceholder') continue;

      const remotePath = `${SUPABASE_SESSION_PATH}/${file.name}`;
      const { data, error } = await supabase.storage
        .from(SUPABASE_SESSION_BUCKET)
        .download(remotePath);

      if (error || !data) {
        logger.warn({ file: file.name, error: error?.message }, 'Failed to download session file');
        continue;
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(path.join(authFolder, file.name), buffer);
      restoredCount++;
    }

    if (restoredCount > 0) {
      logger.info(`Restored ${restoredCount} session files from Supabase. QR scan should NOT be required.`);
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to restore WA session from Supabase. Will require fresh QR scan.');
  }
}

// ─── Main Bot Initialization ────────────────────────────────────────────────

export async function initWABot() {
  connectionState = 'CONNECTING';
  logger.info(`Initializing Baileys WhatsApp Bot... (attempt ${reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);

  // On first init, ensure bucket exists and attempt session restore
  if (reconnectAttempt === 0) {
    await ensureSessionBucketExists();
    await restoreSessionFromSupabase();
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: false
  }));
  logger.info(`Using Baileys WA v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ['Agrikarta Bot', 'Chrome', '1.0.0']
  });

  // Save credentials & backup to Supabase on every update
  sock.ev.on('creds.update', async () => {
    await saveCreds();
    // Fire-and-forget backup — don't block the event loop
    backupSessionToSupabase().catch(err => {
      logger.warn({ err: err.message }, 'Async Supabase session backup failed');
    });
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n==================================================');
      logger.info('Scan the QR code below using WhatsApp on your phone:');
      console.log('==================================================\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn(`WhatsApp connection closed (statusCode: ${statusCode}). shouldReconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        reconnectAttempt++;

        if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
          connectionState = 'PERMANENTLY_DISCONNECTED';
          logger.error(
            `❌ CRITICAL: WhatsApp Bot failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts. ` +
            `Manual intervention required. Restart the server or check network connectivity.`
          );
          return;
        }

        connectionState = 'RECONNECTING';
        const delay = calculateBackoffDelay(reconnectAttempt);
        logger.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS})...`);

        setTimeout(() => {
          initWABot();
        }, delay);
      } else {
        connectionState = 'PERMANENTLY_DISCONNECTED';
        logger.error(
          'WhatsApp session logged out by user. Clear auth_info_baileys folder and restart to scan a new QR code.'
        );
      }
    } else if (connection === 'open') {
      connectionState = 'CONNECTED';
      reconnectAttempt = 0; // Reset counter on successful connection
      logger.info('✅ WhatsApp Bot connected successfully!');
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        await handleIncomingMessage(sock, msg);
      }
    }
  });

  return sock;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export function getWASocket() {
  return sock;
}

export function getConnectionState() {
  return {
    state: connectionState,
    reconnectAttempt,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    isConnected: connectionState === 'CONNECTED'
  };
}
