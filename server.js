const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. CORS Configuration for GitHub Pages Cross-Origin Requests
app.use(cors({
  origin: ['https://gauravgardade7-rgb.github.io', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 2. Initialize Razorpay Instance with Environment Variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Root Health-Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'active', message: 'RoomFinder Backend Operational' });
});

// Endpoint 1: Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount = 10, currency = 'INR', receipt } = req.body; 

    // Convert Rupees to Paise (Razorpay expects amount in lowest currency unit)
    // If frontend sends 10 (rupees), multiply by 100 to get 1000 paise
    const amountInPaise = Math.round(Number(amount) * 100);

    if (isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise)' });
    }

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      id: order.id,            // Matches frontend expecting `orderData.id`
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Order Backend Error:', error);
    return res.status(500).json({ 
      error: 'Failed to create Razorpay order', 
      details: error.message || error 
    });
  }
});

// Endpoint 2: Verify Payment Signature
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature === razorpay_signature) {
      return res.status(200).json({ status: 'success', message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ status: 'failure', message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Start Server Listening on Dynamic Render Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
