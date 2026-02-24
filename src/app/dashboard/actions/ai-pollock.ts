"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractMetricsFromTranscript(transcript: string) {
  try {
    const prompt = `
      Você é um assistente de avaliação física de elite.
      O treinador ditou medidas de um aluno. Podem ser Dobras Cutâneas (em milímetros) ou Circunferências/Perímetros (em centímetros).
      
      Transcrição: "${transcript}"

      Sua tarefa é extrair os números. 
      REGRAS RÍGIDAS:
      1. Se uma medida NÃO foi mencionada no áudio, retorne "null" (NUNCA retorne 0 para o que não foi dito).
      2. Interprete sinônimos (ex: "braço direito" = braco_dir, "panturrilha" = panturrilha_dir/esq, "axilar" = axilar_media).
      
      Retorne APENAS um objeto JSON neste formato exato:
      {
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
