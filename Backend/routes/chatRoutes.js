import express from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../firebase.js"; // Import DB from one level up

const router = express.Router();

// Initialize Gemini (Make sure .env is loaded in server.js)


// ---------------------------------------------------------
// ROUTE 1: Chat with AI & Save to Firebase
// Endpoint: POST /api/chat
// ---------------------------------------------------------
router.post("/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 1. Get Answer from Gemini 2.5
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
    });
    const replyText = response.text;

    // 2. Save to Firebase (Only if userId exists)
    // Structure: users -> [userId] -> chats -> [Auto-ID]
    if (userId) {
      await db.collection("users").doc(userId).collection("chats").add({
        role: "user",
        message: message,
        reply: replyText,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ reply: replyText });

  } catch (error) {
    console.error("❌ Chat Error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// ---------------------------------------------------------
// ROUTE 2: Get Chat History for a User
// Endpoint: GET /api/history/:userId
// ---------------------------------------------------------
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch from Firebase
    const snapshot = await db.collection("users")
      .doc(userId)
      .collection("chats")
      .orderBy("timestamp", "desc") // Newest first
      .get();

    // Convert to simple array
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(history);

  } catch (error) {
    console.error("❌ History Error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;