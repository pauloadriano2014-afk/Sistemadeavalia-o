"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    // CORREÇÃO: Usando o nome que apareceu na SUA lista (gemini-flash-latest).
    // Ele é 1.5 (passa no Render EUA) e existe na sua chave.
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Lógica de limpeza IDÊNTICA ao seu arquivo ai-compare.ts que funciona
    const processBase64 = (base64String: string) => {
        return base64String.split(",")[1] || base64String;
    };

    // Forçamos image/jpeg para o Google não reclamar, mesmo se vier outra coisa
    const imageParts = images.map(img => ({
      inlineData: {
        data: processBase64(img.base64),
        mimeType: "image/jpeg"
      }
    }));

    const prompt = `
      ATUE COMO UM TREINADOR DE ELITE DE FISICULTURISMO E BIOMECÂNICA.
      
      CONTEXTO DO ALUNO:
      - Nome: ${context.name}
      - Gênero: ${context.gender}
      - Objetivo: ${context.goal}
      - Idade: ${context.age}
      - Histórico: ${context.history || "Não informado"}

      Sua missão é fazer um DIAGNÓSTICO FÍSICO INICIAL completo baseado nessas fotos.
      
      ESTRUTURA DA RESPOSTA (Markdown):
      ## 1. ANÁLISE ESTRUTURAL
      - Avalie a estrutura óssea e postura.
      - Estimativa visual de BF% (Gordura Corporal).

      ## 2. PONTOS FORTES
      - Quais grupos musculares se destacam?

      ## 3. PONTOS DE MELHORIA
      - Quais músculos estão "para trás"? Assimetrias?

      ## 4. VEREDITO E ESTRATÉGIA
      - Sugestão de fase (Cutting/Bulking) e foco do treino.

      NOTA: Fale diretamente com o aluno (${context.name}).
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return { text: response.text() };

  } catch (error: any) {
    console.error("Erro na IA (Assessment):", error);
    // Retorna o erro exato para sabermos se foi Location ou NotFound
    return { error: `Erro na IA: ${error.message}` };
  }
}