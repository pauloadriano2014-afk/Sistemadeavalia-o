"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractMetricsFromTranscript(transcript: string) {
  try {
    const prompt = `
      Você é um assistente de avaliação física de elite.
      O treinador ditou medidas de um aluno. Podem ser Dados Básicos, Dobras Cutâneas (em milímetros) ou Circunferências (em centímetros).
      
      Transcrição: "${transcript}"

      REGRAS RÍGIDAS:
      1. Se uma medida NÃO foi mencionada, retorne "null" (NUNCA invente ou retorne 0 para o que não foi dito).
      2. Converta a altura sempre para centímetros (ex: "1 metro e 80" = 180, "1.75" = 175).
      
      Retorne APENAS um objeto JSON neste formato exato:
      {
        "basicos": {
          "peso": null, "idade": null, "altura": null
        },
        "dobras": {
          "peitoral": null, "axilar_media": null, "triceps": null, "subescapular": null,
          "abdomen": null, "suprailiaca": null, "coxa": null
        },
        "circunferencias": {
          "torax": null, "cintura": null, "abdomen_circ": null, "quadril": null,
          "braco_dir": null, "braco_esq": null, "coxa_dir": null, "coxa_esq": null,
          "panturrilha_dir": null, "panturrilha_esq": null
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { error: "Nenhum dado retornado." };

    return { data: JSON.parse(content) };

  } catch (error: any) {
    console.error("Erro na extração de medidas:", error);
    return { error: "Erro ao processar as medidas via IA." };
  }
}
