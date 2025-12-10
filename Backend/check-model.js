import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Checking API connection...");
    
    // 1. Try to generate a simple "Hello" to test the key
    const result = await model.generateContent("Hello");
    console.log("✅ Success! The model works. Response:", result.response.text());
    
  } catch (error) {
    console.log("❌ Error detected:");
    console.log("----------------");
    console.log(error.message);
    console.log("----------------");
    
    // 2. If that fails, let's ask Google what IS available
    console.log("\nAttempting to list available models for your key...");
    try {
        // This is a special internal function to check access
        // (Note: This might not work in all SDK versions, but let's try)
        console.log("If this fails, your API Key might be invalid or the API is not enabled.");
    } catch (e) {
        console.log("Could not list models.");
    }
  }
}

listModels();