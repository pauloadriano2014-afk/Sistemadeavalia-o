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

    // AQUI ESTÁ A MUDANÇA: O Prompt agora ensina a IA a ser didática
    const promptText = `
      ATUE COMO PAULO ADRIANO: Personal Trainer, Campeão de Fisiculturismo Natural e Educador.
      
      ## DADOS DO ALUNO(A)
      - Nome: ${context.name} (${context.gender})
      - Objetivo: ${context.goal}
      - Histórico/Contexto (Narrado pelo Paulo): "${context.history || "Não informado"}"

      ## SUA MISSÃO
      Criar um relatório de "Raio-X Inicial" que será enviado para o aluno ler.
      
      ## O TOM DE VOZ (O "EQUILÍBRIO DE OURO"):
      1. **Autoridade:** Use o termo técnico correto (ex: "Valgo Dinâmico", "Cifose", "Retração Escapular").
      2. **Didática:** IMEDIATAMENTE explique o que isso significa de forma simples.
      3. **Sem "Falar difícil à toa":** O aluno precisa entender ONDE ele vai melhorar.
      
      ## FORMATO DE RESPOSTA (Ideal para copiar e colar no Canva):
      Use Markdown. Seja visualmente limpo.

      # 🏛️ ANÁLISE ESTRUTURAL
      *(Avalie postura e estrutura óssea. Explique o impacto visual disso)*
      * **Exemplo:** "Leve escoliose (desvio na coluna), o que faz seu ombro direito parecer mais baixo."

      # 🔥 PONTOS FORTES (A GENÉTICA)
      *(Destaque 3 pontos positivos. Use a estrutura: Termo Técnico - Explicação Visual)*
      * **[Grupo Muscular]:** Explicação. (ex: "Quadríceps: Excelente volume na parte externa da coxa, dando aspecto de perna torneada.")
      
      # ⚠️ PONTOS DE MELHORIA (O FOCO)
      *(Liste 3 prioridades. Explique COMO vamos resolver)*
      * **[Prioridade 1]:** O problema e a solução. (ex: "Deltóide Lateral: O ombro está estreito em relação ao quadril. Vamos focar em elevações para alargar a silhueta.")
      * **[Prioridade 2]:** ...
      * **[Postura/Simetria]:** ...

      # 🎯 VEREDITO E ESTRATÉGIA
      *(Resumo de 2 linhas falando diretamente com o aluno sobre o plano de ataque)*
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
      max_tokens: 1200,
      temperature: 0.7, 
    });

    const text = response.choices[0]?.message?.content;

    if (!text) return { error: "A IA não retornou texto." };

    return { text };

  } catch (error: any) {
    console.error("Erro OpenAI:", error);
    if (error.status === 429) return { error: "Erro de cota. Verifique saldo OpenAI." };
    return { error: `Erro na análise: ${error.message}` };
  }
}