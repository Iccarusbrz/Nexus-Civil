export const geminiModel = "gemini-1.5-flash";

async function callGeminiProxy(prompt: string) {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, modelName: geminiModel }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to call Gemini API");
  }

  const data = await response.json();
  return data.text;
}

export async function analyzeCompliance(projectData: any, norms: string[]) {
  const prompt = `
    Analise os seguintes dados de um projeto de construção para conformidade com estas normas brasileiras: ${norms.join(", ")}.
    Dados do Projeto: ${JSON.stringify(projectData)}
    
    IMPORTANTE: Responda inteiramente em Português do Brasil.
    
    Forneça uma resposta JSON com:
    - status: "compliant" | "non-compliant" | "warning"
    - findings: array de { norm: string, issue: string, severity: "low" | "medium" | "high" }
    - recommendations: array de strings
    
    Retorne APENAS o JSON.
  `;

  const text = await callGeminiProxy(prompt);
  try {
    // Clean potential markdown code blocks
    const cleanedText = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    return { status: "error", findings: [], recommendations: ["Erro ao processar análise AI"] };
  }
}
