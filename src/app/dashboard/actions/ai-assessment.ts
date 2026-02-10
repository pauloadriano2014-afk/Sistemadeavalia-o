"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepara as imagens para o Gemini
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.base64.split(",")[1], // Remove o header do base64
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
      Seja técnico, direto e motivador. Use termos da área (simetria, linha de cintura, inserção muscular, maturidade).

      ESTRUTURA DA RESPOSTA (Use Markdown):

      ## 1. ANÁLISE ESTRUTURAL
      - Avalie a estrutura óssea (clavículas, cintura pélvica).
      - Postura (algum desvio óbvio?).
      - Estimativa visual de BF% (Gordura Corporal).

      ## 2. PONTOS FORTES (Genética Favorável)
      - Quais grupos musculares se destacam?
      - Pontos positivos da linha do shape.

      ## 3. PONTOS DE MELHORIA (O Foco do Treino)
      - Quais músculos estão "para trás" e precisam de prioridade?
      - Assimetrias visíveis?

      ## 4. VEREDITO E ESTRATÉGIA
      - Qual deve ser a fase inicial? (Cutting agressivo, Recomposição, Bulking Limpo?)
      - Sugestão de divisão de treino (ex: Focar em deltoides laterais e dorsais para alargar o shape).

      NOTA: Fale diretamente com o aluno (${context.name}). Seja profissional mas acolhedor.
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return { text: response.text() };

  } catch (error: any) {
    console.error("Erro na IA:", error);
    return { error: "Falha ao gerar análise. Verifique as fotos e tente novamente." };
  }
}