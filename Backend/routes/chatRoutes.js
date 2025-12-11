import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase.js"; 
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. GET ALL THREADS (For Sidebar History)
// ==========================================
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

// ==========================================
// 2. GET MESSAGES FOR A THREAD (When clicked)
// ==========================================
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

// ==========================================
// 3. SEND MESSAGE (Text + Image + Pro Check)
// ==========================================
router.post("/chat", async (req, res) => {
  try {
    const { message, userId, image, threadId } = req.body;
    let currentThreadId = threadId;

    // --- A. SUBSCRIPTION & LIMIT CHECK ---
    if (userId) {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({ plan: "free", messageCount: 1 }, { merge: true });
      } else {
        const userData = userDoc.data();

        // 🔒 LOCK: Image is Pro Only
        if (image && userData.plan !== "pro") {
          return res.status(403).json({ reply: "🔒 Image Analysis is a Pro Feature. Please Upgrade!" });
        }

        // Check Free Limit (Text)
        if (userData.plan === "free" && userData.messageCount >= 10) {
          return res.status(403).json({ reply: "🛑 Daily limit reached. Upgrade to Pro!" });
        }

        // Increment Count
        await userRef.update({ messageCount: (userData.messageCount || 0) + 1 });
      }
    }

    // --- B. AI GENERATION ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let result;

    if (image) {
      // 📸 VISION MODE
      const imagePart = {
        inlineData: {
          data: image.split(",")[1], // Remove 'data:image/png;base64,'
          mimeType: "image/png", 
        },
      };
      result = await model.generateContent([message, imagePart]);
    } else {
      // 💬 TEXT MODE
      result = await model.generateContent(message);
    }

    const response = await result.response;
    const replyText = response.text();

    // --- C. SAVE TO DATABASE (Thread Logic) ---
    if (userId) {
      const userRef = db.collection("users").doc(userId);

      // If New Chat -> Create Thread First
      if (!currentThreadId) {
        const newThreadRef = await userRef.collection("threads").add({
          title: message.substring(0, 30) + "...", 
          createdAt: new Date().toISOString()
        });
        currentThreadId = newThreadRef.id;
      }

      // Save Message to Thread
      const messagesRef = userRef.collection("threads").doc(currentThreadId).collection("messages");

      await messagesRef.add({ 
        role: "user", 
        content: message, 
        image: image || null, // Save image if exists
        timestamp: new Date().toISOString() 
      });
      
      await messagesRef.add({ 
        role: "assistant", 
        content: replyText, 
        timestamp: new Date().toISOString() 
      });
    }

    // Return Reply AND ThreadId (so frontend updates URL/Sidebar)
    res.json({ reply: replyText, threadId: currentThreadId });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;