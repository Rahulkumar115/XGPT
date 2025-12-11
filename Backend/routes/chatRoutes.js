import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase.js"; 
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const router = express.Router();

// 1. GET ALL THREADS (For the Sidebar)
router.get("/threads/:userId", async (req, res) => {
  try {
    const snapshot = await db.collection("users").doc(req.params.userId).collection("threads")
      .orderBy("createdAt", "desc").get();
    
    const threads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(threads);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// 2. GET MESSAGES FOR A SPECIFIC THREAD (When clicking a sidebar item)
router.get("/thread/:userId/:threadId", async (req, res) => {
  try {
    const { userId, threadId } = req.params;
    const snapshot = await db.collection("users").doc(userId)
      .collection("threads").doc(threadId)
      .collection("messages").orderBy("timestamp", "asc").get();

    const messages = snapshot.docs.map(doc => doc.data());
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// 3. SEND MESSAGE (Handles both New & Existing Threads)
router.post("/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "API Key Missing" });

    const { message, userId, threadId } = req.body;
    let currentThreadId = threadId;

    // A. AI GENERATION
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(message);
    const replyText = result.response.text();

    // B. DATABASE LOGIC
    if (userId) {
      const userRef = db.collection("users").doc(userId);

      // If NO threadId is provided, create a NEW Thread first
      if (!currentThreadId) {
        const newThreadRef = await userRef.collection("threads").add({
          title: message.substring(0, 30) + "...", // Title is first 30 chars
          createdAt: new Date().toISOString()
        });
        currentThreadId = newThreadRef.id;
      }

      // Save Message to the specific thread
      const threadRef = userRef.collection("threads").doc(currentThreadId);
      const messagesRef = threadRef.collection("messages");

      await messagesRef.add({ role: "user", content: message, timestamp: new Date().toISOString() });
      await messagesRef.add({ role: "assistant", content: replyText, timestamp: new Date().toISOString() });
    }

    // Return the reply AND the threadId (so frontend knows which thread we are in)
    res.json({ reply: replyText, threadId: currentThreadId });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;