import express from 'express';
import { syncPersona } from '../controllers/personaController.js';

const router = express.Router();

// Webhook endpoint for Google Form persona evaluation synchronization
router.post('/persona-sync', syncPersona);

export default router;
