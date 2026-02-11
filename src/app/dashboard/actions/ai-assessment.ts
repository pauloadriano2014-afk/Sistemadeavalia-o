"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    // 1. MODELO: Usando EXATAMENTE o mesmo do seu comparativo que funciona
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 2. LIMPEZA: A mesma função simples e robusta do comparativo
    const processBase64 = (base64String: string) => {
        return base64String.split(",")[1] || base64String;
    };

    // 3. PREPARAÇÃO: Forçando "image/jpeg" igual ao comparativo
    // Isso resolve problemas de HEIC/PNG, pois o Gemini se vira com o binário
    const imageParts = images.map(img => ({
      inlineData: {
        data: processBase64(img.base64),
        mimeType: "image/jpeg" 
      }
    }));

    // 4. PROMPT (Adaptado para Diagnóstico, mas com a mesma estrutura de chamada)
    const prompt = `
      ATUE COMO UM TREINADOR DE ELITE DE FISICULTURISMO E BIOMECÂNICA.
      
      CONTEXTO DO ALUNO:
      - Nome: ${context.name}
      - Gênero: ${context.gender}
      - Objetivo: ${context.goal}
      - Idade: ${context.age}
      - Histórico: ${context.history || "Não informado"}

      Sua missão é fazer um DIAGNÓSTICO FÍSICO INICIAL completo baseado nessas fotos.
      Seja técnico, direto e motivador.

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
      - Sugestão de divisão de treino.

      NOTA: Fale diretamente com o aluno (${context.name}).
    `;

    // 5. CHAMADA: Igual ao comparativo
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    
    return { text: response.text() };

  } catch (error: any) {
    console.error("Erro na IA (Assessment):", error);
    // Retorna mensagem genérica igual ao comparativo para não assustar com detalhes técnicos, 
    // mas loga o erro real no console do servidor.
    return { error: "Erro ao processar análise. Verifique se as imagens não estão corrompidas." };
  }
}