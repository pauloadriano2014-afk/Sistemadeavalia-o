"use server";

// NÃO IMPORTAMOS MAIS A BIBLIOTECA DO GOOGLE
// Vamos usar o fetch nativo do Javascript

export async function generateInitialAssessment(images: { label: string, base64: string }[], context: any) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // 1. Limpeza do Base64 (Mantemos essa lógica que é vital)
    const processBase64 = (base64String: string) => {
        if (typeof base64String === 'string' && base64String.includes(",")) {
            return base64String.split(",")[1];
        }
        return base64String;
    };

    // 2. Prepara as partes da imagem no formato JSON que a API espera
    const imageParts = images.map(img => ({
      inline_data: {
        mime_type: "image/jpeg",
        data: processBase64(img.base64)
      }
    }));

    // 3. O Prompt
    const promptText = `
      ATUE COMO UM TREINADOR DE ELITE DE FISICULTURISMO E BIOMECÂNICA.
      
      CONTEXTO DO ALUNO:
      - Nome: ${context.name}
      - Gênero: ${context.gender}
      - Objetivo: ${context.goal}
      - Idade: ${context.age}
      - Histórico: ${context.history || "Não informado"}

      Sua missão é fazer um DIAGNÓSTICO FÍSICO INICIAL completo baseado nessas fotos.
      
      ESTRUTURA DA RESPOSTA (Use Markdown):
      ## 1. ANÁLISE ESTRUTURAL
      - Avalie a estrutura óssea e postura.
      - Estimativa visual de BF% (Gordura Corporal).

      ## 2. PONTOS FORTES (Genética Favorável)
      - Quais grupos musculares se destacam?

      ## 3. PONTOS DE MELHORIA (O Foco do Treino)
      - Quais músculos estão "para trás"? Assimetrias?

      ## 4. VEREDITO E ESTRATÉGIA
      - Sugestão de fase (Cutting/Bulking) e foco do treino.

      NOTA: Fale diretamente com o aluno (${context.name}).
    `;

    // 4. CHAMADA DIRETA VIA FETCH (Sem biblioteca para atrapalhar)
    // Usando gemini-1.5-flash porque ele funciona GLOBALMENTE (sem erro de região)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                ...imageParts
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // 5. Tratamento de Erro da API Raw
    if (data.error) {
      console.error("Erro da API Google (Raw):", JSON.stringify(data.error, null, 2));
      return { error: `Erro API: ${data.error.message}` };
    }

    // 6. Extrai o texto da resposta
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return { error: "A IA não retornou texto. Tente novamente." };
    }

    return { text };

  } catch (error: any) {
    console.error("Erro no Fetch:", error);
    return { error: `Erro interno: ${error.message}` };
  }
}