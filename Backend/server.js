import paymentRoutes from "./routes/paymentRoutes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js"; // Import the routes

// 1. Load Environment Variables
dotenv.config();

const app = express();
const PORT = 5000;

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: "50mb"}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 3. Use Routes
// This adds "/api" to all routes in chatRoutes.js
// So: "/chat" becomes "/api/chat"
app.use("/api", chatRoutes);
app.use("/api", paymentRoutes);

// 4. Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});