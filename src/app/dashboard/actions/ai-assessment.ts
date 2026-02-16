"use server";

import OpenAI from "openai";

const openai = new OpenAI();

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    const contentImages = images.map(img => {
      const imageUrl = img.base64.startsWith("data:") 
        ? img.base64 
        : `data:image/jpeg;base64,${img.base64}`;

      return {
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "high" 
        }
      };
    });

    // PROMPT "MODO DETALHISTA & ESTRUTURADO"
    const promptText = `
      ATUE COMO: Paulo Adriano, Treinador de Alta Performance.
      CONTEXTO: Avaliação física técnica para prescrição.
      ALUNO: ${context.name} (${context.gender}), Objetivo: ${context.goal}.
      RELATO: "${context.history || "Sem relato"}"

      SUA MISSÃO:
      Você é o treinador pessoal. Fale diretamente com o aluno ("Eu vi...", "Notei...").
      Seja DETALHISTA. Não faça resumos curtos. Use o espaço para educar o aluno sobre o corpo dele.

      PARA CADA ÂNGULO, ANALISE:
      1. Pontos Fortes (O que preservar).
      2. Pontos de Atenção (Gordura, flacidez, assimetria).
      3. Sugestão rápida de correção.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "frente": "Descreva detalhadamente a vista frontal. Fale sobre a largura de ombros, depois desça para o peitoral/busto, analise a linha de cintura (gordura visceral vs subcutânea) e finalize analisando o volume e corte das pernas (quadríceps).",
        "perfil": "Foco total em postura e alinhamento. Analise se há protusão abdominal, lordose ou cifose. Analise o volume do glúteo e a harmonia entre tronco e membros inferiores.",
        "costas": "Seja crítico. Procure gordura na linha do sutiã/lombar. Analise a densidade muscular, largura da dorsal e se os posteriores de coxa acompanham o glúteo.",
        "veredito": "Sua estratégia final COMPLETA. Fale sobre a divisão de treino sugerida (ex: foco em deltoides), a estratégia nutricional (ex: ciclo de carboidratos) e cardio."
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "user",
          // @ts-ignore
          content: [
            { type: "text", text: promptText },
            ...contentImages
          ],
        },
      ],
      max_tokens: 2000, // Aumentei para permitir textos maiores
      temperature: 0.5,
      response_format: { type: "json_object" } 
    });

    const text = response.choices[0]?.message?.content;
    if (!text) return { error: "A IA não retornou texto." };

    try {
        const json = JSON.parse(text);
        return { data: json }; 
    } catch (e) {
        return { error: "Erro ao processar resposta da IA." };
    }

  } catch (error: any) {
    console.error("Erro OpenAI:", error);
    if (error.status === 429) return { error: "Erro de cota. Verifique saldo OpenAI." };
    return { error: `Erro na análise: ${error.message}` };
  }
}