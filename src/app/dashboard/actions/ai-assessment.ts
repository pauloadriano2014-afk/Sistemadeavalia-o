"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    // TENTATIVA 1: Usando o nome exato da versão (Mais seguro que o apelido)
    // Se o 'latest' falhar, o '001' costuma passar
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const processBase64 = (base64String: string) => {
        if (typeof base64String === 'string' && base64String.includes(",")) {
            return base64String.split(",")[1];
        }
        return base64String;
    };

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

      Sua missão é fazer um DIAGNÓSTICO FÍSICO INICIAL completo.
      
      ESTRUTURA DA RESPOSTA (Use Markdown):
      ## 1. ANÁLISE ESTRUTURAL
      ## 2. PONTOS FORTES
      ## 3. PONTOS DE MELHORIA
      ## 4. VEREDITO E ESTRATÉGIA
      
      NOTA: Fale diretamente com o aluno (${context.name}).
    `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return { text: response.text() };

  } catch (error: any) {
    console.error("Erro na IA (Assessment):", error);

    // DEBUG: Se der erro, vamos listar no Log quais modelos o servidor consegue ver
    // Isso vai aparecer no seu painel do Render se falhar de novo
    try {
        console.log("Tentando listar modelos disponíveis...");
        // @ts-ignore
        const models = await genAI.listModels(); 
        console.log("Modelos disponíveis:", JSON.stringify(models));
    } catch (e) {
        console.log("Erro ao listar modelos:", e);
    }

    return { error: `Erro na IA: ${error.message}` };
  }
}