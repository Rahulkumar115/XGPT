import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../firebase.js";
import dotenv from "dotenv";
import { createRequire } from "module";

dotenv.config({ path: "./.env" });
const router = express.Router();

// Use CommonJS pdf-parse from ESM
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");   // make sure this is the NPM package "pdf-parse"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. GET ALL THREADS
// ==========================================
router.get("/threads/:userId", async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .doc(req.params.userId)
      .collection("threads")
      .orderBy("createdAt", "desc")
      .get();

    const threads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(threads);
  } catch (e) {
    console.error("Threads Error:", e);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// ==========================================
// 2. GET MESSAGES
// ==========================================
router.get("/thread/:userId/:threadId", async (req, res) => {
  try {
    const { userId, threadId } = req.params;
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("threads")
      .doc(threadId)
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();

    const messages = snapshot.docs.map((doc) => doc.data());
    res.json(messages);
  } catch (e) {
    console.error("Messages Error:", e);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ==========================================
// 3. SEND MESSAGE (Text + Image + PDF)
// ==========================================
// ==========================================
// ⚡ REPLACEMENT: STREAMING CHAT ROUTE
// ==========================================
router.post("/chat", async (req, res) => {
  try {
    const { message, userId, image, pdfData, threadId } = req.body;
    let currentThreadId = threadId;

    // 1. SUBSCRIPTION & LIMIT CHECK
    if (userId) {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({ plan: "free", messageCount: 1 }, { merge: true });
      } else {
        const userData = userDoc.data();
        if ((image || pdfData) && userData.plan !== "pro") {
          return res.status(403).json({ reply: "🔒 Media Analysis is a Pro Feature. Please Upgrade!" });
        }
        if (userData.plan === "free" && userData.messageCount >= 10) {
          return res.status(403).json({ reply: "🛑 Daily limit reached. Upgrade to Pro!" });
        }
        await userRef.update({ messageCount: (userData.messageCount || 0) + 1 });
      }
    }

    // 2. PREPARE INPUT (Text/PDF/Image)
    let promptToSend = message;
    if (pdfData) {
      try {
        const buffer = Buffer.from(pdfData.split(",")[1], 'base64');
        // Ensure pdfParse is loaded correctly (using the fix we added earlier)
        if (typeof pdfParse !== 'function' && pdfParse.default) {
             pdfParse = pdfParse.default;
        }
        const pdfOutput = await pdfParse(buffer);
        promptToSend = `Document Content:\n${pdfOutput.text}\n\nUser Question: ${message}`;
      } catch (err) {
        return res.status(500).json({ reply: "❌ PDF Error" });
      }
    }

    // 3. DATABASE SETUP (Create thread before streaming starts)
    if (userId && !currentThreadId) {
      const newThreadRef = await db.collection("users").doc(userId).collection("threads").add({
        title: message.substring(0, 30) + "...", 
        createdAt: new Date().toISOString()
      });
      currentThreadId = newThreadRef.id;
    }

    // 4. START STREAMING RESPONSE 🌊
    // Set headers to keep connection open
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Thread-ID", currentThreadId || ""); 

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let result;

    if (image) {
      const imagePart = { inlineData: { data: image.split(",")[1], mimeType: "image/png" } };
      result = await model.generateContentStream([message, imagePart]); // 👈 STREAM METHOD
    } else {
      result = await model.generateContentStream(promptToSend); // 👈 STREAM METHOD
    }

    let fullReply = ""; 

    // Loop through chunks and send them immediately
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullReply += chunkText; 
      res.write(chunkText); // ⚡ Send to frontend instantly
    }

    res.end(); // Close connection

    // 5. SAVE FULL CONVERSATION TO DB
    if (userId) {
      const messagesRef = db.collection("users").doc(userId)
        .collection("threads").doc(currentThreadId).collection("messages");

      await messagesRef.add({ 
        role: "user", 
        content: message, 
        image: image || null, 
        hasPdf: !!pdfData,
        timestamp: new Date().toISOString() 
      });
      
      await messagesRef.add({ 
        role: "assistant", 
        content: fullReply, 
        timestamp: new Date().toISOString() 
      });
    }

  } catch (error) {
    console.error("Stream Error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Server Error" });
  }
});

export default router;