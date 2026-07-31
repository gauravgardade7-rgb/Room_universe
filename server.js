const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* ==========================================================
   Validate Environment Variables
========================================================== */

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("❌ Razorpay Environment Variables Missing!");
    process.exit(1);
}

/* ==========================================================
   CORS
========================================================== */

app.use(cors({
    origin: [
        'https://gauravgardade7-rgb.github.io',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/* ==========================================================
   Razorpay Instance
========================================================== */

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ==========================================================
   Health Check
========================================================== */

app.get('/', (req, res) => {

    res.json({
        status: "active",
        server: "RoomFinder Backend",
        razorpay: "Connected",
        time: new Date().toISOString()
    });

});

/* ==========================================================
   Create Order
========================================================== */

app.post('/api/create-order', async (req, res) => {

    try {

        console.log("======================================");
        console.log("📦 CREATE ORDER REQUEST");
        console.log(req.body);

        const {
            amount = 10,
            currency = "INR",
            receipt
        } = req.body;

        const amountInPaise = Math.round(Number(amount) * 100);

        if (isNaN(amountInPaise) || amountInPaise < 100) {

            return res.status(400).json({
                success: false,
                error: "Invalid Amount"
            });

        }

        const order = await razorpay.orders.create({

            amount: amountInPaise,
            currency,
            receipt: receipt || `receipt_${Date.now()}`

        });

        console.log("✅ ORDER CREATED");
        console.log(order);

        res.json({

            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID

        });

    }

    catch (err) {

        console.error("❌ CREATE ORDER ERROR");
        console.error(err);

        res.status(500).json({

            success: false,
            error: err.message

        });

    }

});

/* ==========================================================
   Verify Payment
========================================================== */

app.post('/api/verify-payment', (req, res) => {

    try {

        console.log("======================================");
        console.log("💳 VERIFY PAYMENT REQUEST");
        console.log(req.body);

        const {

            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature

        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({

                success: false,
                message: "Missing Parameters"

            });

        }

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                razorpay_order_id + "|" + razorpay_payment_id
            )
            .digest("hex");

        console.log("Generated Signature:");
        console.log(generatedSignature);

        console.log("Received Signature:");
        console.log(razorpay_signature);

        if (generatedSignature === razorpay_signature) {

            console.log("✅ PAYMENT VERIFIED SUCCESSFULLY");

            return res.json({

                success: true,
                message: "Payment Verified",

                payment: {

                    payment_id: razorpay_payment_id,
                    order_id: razorpay_order_id

                }

            });

        }

        console.log("❌ SIGNATURE MISMATCH");

        return res.status(400).json({

            success: false,
            message: "Invalid Signature"

        });

    }

    catch (err) {

        console.error("❌ VERIFY PAYMENT ERROR");
        console.error(err);

        return res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

/* ==========================================================
   404
========================================================== */

app.use((req, res) => {

    res.status(404).json({

        success: false,
        message: "API Not Found"

    });

});

/* ==========================================================
   Global Error Handler
========================================================== */

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        success: false,
        message: "Internal Server Error"

    });

});

/* ==========================================================
   Start Server
========================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log("====================================");
    console.log("🚀 RoomFinder Backend Started");
    console.log("Port :", PORT);
    console.log("Key  :", process.env.RAZORPAY_KEY_ID);
    console.log("====================================");

});
