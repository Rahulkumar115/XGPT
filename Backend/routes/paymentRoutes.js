import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../firebase.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. CREATE ORDER
router.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: 49900, // ₹499.00 (in paise)
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);

  } catch (error) {
    console.error("Razorpay Create Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// 2. VERIFY PAYMENT
router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

    // Create the expected signature to verify authenticity
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // ✅ Payment is Legit! Upgrade the user.
      await db.collection("users").doc(userId).update({
        plan: "pro",
        subscriptionDate: new Date().toISOString()
      });

      res.json({ success: true, message: "Payment Verified" });
    } else {
      res.status(400).json({ success: false, error: "Invalid Signature" });
    }
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;