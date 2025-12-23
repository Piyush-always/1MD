require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors({
  origin: [
    "https://www.1mindry.com",
    "https://onemd-backend.onrender.com"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Firebase 
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  ),
});

const db = admin.firestore();

// Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Create order
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: req.body.amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save payment
app.post("/save-payment", async (req, res) => {
  try {
    await db.collection("payments").add({
      razorpay_payment_id: req.body.razorpay_payment_id,
      razorpay_order_id: req.body.razorpay_order_id,
      razorpay_signature: req.body.razorpay_signature,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// FOR RENDER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
