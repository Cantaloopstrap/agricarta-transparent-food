import express from 'express';
import { createCheckout, handleMidtransWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// Route: Checkout transaction initiation
router.post('/checkout', createCheckout);

// Route: Midtrans payment status webhook callback
router.post('/midtrans-webhook', handleMidtransWebhook);

export default router;
