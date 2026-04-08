import { Handler } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler: Handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { prompt, modelName: receivedModelName } = JSON.parse(event.body || "{}");
    console.log("Received model name from frontend:", receivedModelName);
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "Gemini API key not configured on Netlify. Please add GEMINI_API_KEY to your Netlify Environment Variables." 
        })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Force a known universally available model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error: any) {
    console.error("Gemini Function Error:", error);
    
    let clientMessage = error.message;
    if (error.message.includes("API key not valid")) {
      clientMessage = "A chave da API Gemini é inválida. Verifique suas variáveis de ambiente no Netlify.";
    }

    // Try to list models to help debug what models are available
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      console.log("AVAILABLE MODELS:", JSON.stringify(data));
      if (data.models) {
        clientMessage += ` | Modelos disponíveis nesta chave: ${data.models.map((m:any) => m.name.replace('models/', '')).join(', ')}`;
      }
    } catch(e) {
      console.error("Failed to list models", e);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: clientMessage })
    };
  }
};
