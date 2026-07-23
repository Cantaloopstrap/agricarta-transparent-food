import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pino from 'pino';
import { initWABot } from './bot/waConnection.js';
import paymentRoutes from './routes/paymentRoutes.js';
import personaRoutes from './routes/personaRoutes.js';

dotenv.config();

const logger = pino({ level: 'info' });
const app = express();
const PORT = process.env.PORT || 5000;

// Security Hardening: Helmet HTTP Headers
app.use(helmet());

// Security Hardening: Restricted CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://agrikarta.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if in allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin }, 'Blocked by CORS policy');
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

// Security Hardening: Express Rate Limiter (Brute-force protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

app.use('/api/', apiLimiter);
app.use(express.json());

// API Routes
app.use('/api', paymentRoutes);
app.use('/api', personaRoutes);

// Health Check Endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Agrikarta Backend Microservice',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Agrikarta Backend & WhatsApp Bot Microservice Running'
  });
});

// Start Express Server and WhatsApp Bot
app.listen(PORT, async () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
  try {
    await initWABot();
  } catch (error) {
    logger.error('Failed to initialize WhatsApp Bot:', error);
  }
});
