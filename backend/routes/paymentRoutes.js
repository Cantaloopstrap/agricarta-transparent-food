import express from 'express';
import { createCheckout, handleMidtransWebhook, verifyToken } from '../controllers/paymentController.js';

const router = express.Router();

// Route: Checkout transaction initiation
router.post('/checkout', createCheckout);

// Route: Midtrans payment status webhook callback
router.post('/midtrans-webhook', handleMidtransWebhook);

// Route: Verify Magic Link JWT Token
router.post('/auth/verify-token', verifyToken);

export default router;
