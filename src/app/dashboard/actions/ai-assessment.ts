"use server";

import OpenAI from "openai";

// Ele busca automaticamente a variável OPENAI_API_KEY no .env
const openai = new OpenAI();

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    // 1. Preparação das imagens para o formato da OpenAI
    // O GPT-4o exige que o base64 tenha o prefixo "data:image/..."
    const contentImages = images.map(img => {
      // Se já vier com prefixo, usa. Se não, adiciona.
      const imageUrl = img.base64.startsWith("data:") 
        ? img.base64 
        : `data:image/jpeg;base64,${img.base64}`;

      return {
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "high" // Força a IA a olhar cada detalhe dos músculos
        }
      };
    });

    const promptText = `
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

    // 2. Chamada para a OpenAI (GPT-4o)
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // O modelo mais inteligente do mundo atualmente
      messages: [
        {
          role: "user",
          // @ts-ignore: O TypeScript pode reclamar dessa estrutura mista, mas é válida na OpenAI
          content: [
            { type: "text", text: promptText },
            ...contentImages
          ],
        },
      ],
      max_tokens: 1500, // Tamanho da resposta
    });

    // 3. Extração do Texto
    const text = response.choices[0]?.message?.content;

    if (!text) {
      return { error: "A IA processou as imagens mas não retornou texto." };
    }

    return { text };

  } catch (error: any) {
    console.error("Erro OpenAI:", error);
    
    // Tratamento de erro específico para cota/pagamento
    if (error.status === 429) {
        return { error: "Erro de cota na OpenAI. Verifique os créditos da API." };
    }

    return { error: `Erro na análise: ${error.message}` };
  }
}