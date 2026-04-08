import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy Route
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, modelName } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(500).json({ 
          error: "Gemini API key not configured. Please go to the Settings menu (gear icon) and add a secret named GEMINI_API_KEY with your Google AI Studio API key." 
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini API Error details:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        errorDetails: error.errorDetails
      });
      
      let clientMessage = error.message;
      if (error.message.includes("API key not valid")) {
        clientMessage = "A chave da API Gemini é inválida. Por favor, verifique se você configurou a secret GEMINI_API_KEY corretamente no menu de configurações (ícone de engrenagem).";
      }
      
      res.status(500).json({ error: clientMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
