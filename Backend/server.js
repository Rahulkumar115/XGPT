import paymentRoutes from "./routes/paymentRoutes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js"; 

dotenv.config();

const app = express();
const PORT = 5000;

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: "50mb"}));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api", chatRoutes);
app.use("/api", paymentRoutes);

// 3. Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});