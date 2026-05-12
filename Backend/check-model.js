import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Checking API connection...");
    
    const result = await model.generateContent("Hello");
    console.log("Success! The model works. Response:", result.response.text());
    
  } catch (error) {
    console.log("Error detected:");
    console.log("----------------");
    console.log(error.message);
    console.log("----------------");
    
    console.log("\nAttempting to list available models for your key...");
    try {
        console.log("If this fails, your API Key might be invalid or the API is not enabled.");
    } catch (e) {
        console.log("Could not list models.");
    }
  }
}

listModels();