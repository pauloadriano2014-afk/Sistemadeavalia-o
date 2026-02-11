"use server";

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // 1. Limpeza do Base64 
    const processBase64 = (base64String: string) => {
        if (typeof base64String === 'string' && base64String.includes(",")) {
            return base64String.split(",")[1];
        }
        return base64String;
    };

    const imageParts = images.map(img => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: processBase64(img.base64)
      }
    }));

    const promptText = `
      ATUE COMO UM TREINADOR DE ELITE.
      CONTEXTO: Nome: ${context.name}, Gênero: ${context.gender}, Objetivo: ${context.goal}, Idade: ${context.age}.
      
      Faça um DIAGNÓSTICO FÍSICO INICIAL completo.
      
      ESTRUTURA DA RESPOSTA (Markdown):
      ## 1. ANÁLISE ESTRUTURAL (Ossos, Postura, BF%)
      ## 2. PONTOS FORTES
      ## 3. PONTOS DE MELHORIA
      ## 4. VEREDITO E ESTRATÉGIA
      
      Seja direto e fale com o aluno.
    `;

    // AQUI ESTÁ O SEGREDO: Usando 'gemini-flash-latest' que apareceu na sua lista
    // Ele aponta para o 1.5 Flash mas funciona onde o nome novo falha.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }, ...imageParts] }]
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Erro API Google:", JSON.stringify(data.error, null, 2));
      return { error: `Erro API (${data.error.code}): ${data.error.message}` };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) return { error: "A IA não retornou texto. Tente novamente." };

    return { text };

  } catch (error: any) {
    console.error("Erro Interno:", error);
    return { error: `Erro interno: ${error.message}` };
  }
}