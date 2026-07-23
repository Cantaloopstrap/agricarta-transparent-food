import jwt from 'jsonwebtoken';
import pino from 'pino';

const logger = pino({ level: 'info' });

/**
 * Middleware to verify JWT authentication token in incoming request headers
 */
export function verifyJwtToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ path: req.path }, 'Unauthorized request: Missing or malformed Authorization header');
    return res.status(401).json({ error: 'Unauthorized: Access token required' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'agrikarta_super_secret_jwt_key_2026';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn({ err: err.message, path: req.path }, 'Unauthorized request: Invalid or expired JWT token');
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired access token' });
  }
}
