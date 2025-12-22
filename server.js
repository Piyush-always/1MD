require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
var admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// Firebase
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
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

// Save payment (WITH VERIFICATION)
app.post("/save-payment", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    // ✅ Save to Firestore
    await db.collection("payments").add({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
