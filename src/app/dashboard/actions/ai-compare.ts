"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export interface CompareContext {
  name: string;
  age: string;
  gender: 'male' | 'female';
  frequency: string;
  injuries: string;
  tone: string;
  
  // NOVOS CAMPOS
  goal: string;
  phase: string; 
  dietCompliance: string; 
  sleep: string; // <--- O ERRO ESTAVA AQUI (FALTAVA ESSA LINHA)
  ingestedCalories: string; 
  cardioProtocol: string; 
  weightBefore: string; 
  weightAfter: string;  
  coachContext: string; 
}

export interface ImagePair {
  poseLabel: string;
  before: string; 
  after: string; 
}

export async function analyzeEvolution(pairs: ImagePair[], ctx: CompareContext) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageParts: any[] = [];
    let imageDescription = "";

    const processBase64 = (base64String: string) => {
        return base64String.split(",")[1] || base64String;
    };

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      imageParts.push({ inlineData: { data: processBase64(pair.before), mimeType: "image/jpeg" } });
      imageParts.push({ inlineData: { data: processBase64(pair.after), mimeType: "image/jpeg" } });
      imageDescription += `- Par ${i + 1} (${pair.poseLabel}): Imagem ${i * 2 + 1} (ANTES) vs Imagem ${i * 2 + 2} (DEPOIS).\n`;
    }

    let toneInstruction = "";
    if (ctx.tone === "acolhedor") toneInstruction = "Seja empático, motivador e celebre pequenas vitórias.";
    else if (ctx.tone === "tecnico") toneInstruction = "Seja cirúrgico, use termos biomecânicos e foque em proporção/simetria.";
    else toneInstruction = "Seja direto, exigente e foque em resultados ('pulso firme').";

    const prompt = `
      ATUE COMO UM TREINADOR DE FISICULTURISMO DE ELITE (COACH).
      Você está analisando a evolução de um atleta.
      
      ## 📋 DADOS DO ATLETA
      - Nome: ${ctx.name} (${ctx.gender})
      - Idade: ${ctx.age} | Treino: ${ctx.frequency}
      - Lesões: ${ctx.injuries || "Nenhuma"}
      
      ## 🔄 CONTEXTO DA EVOLUÇÃO
      - **FASE ATUAL:** ${ctx.phase.toUpperCase()}
      - **CONTEXTO DO COACH:** "${ctx.coachContext}" 
      
      ## 📊 DADOS QUANTITATIVOS
      - Peso Inicial: ${ctx.weightBefore}kg -> Peso Atual: ${ctx.weightAfter}kg
      - Calorias: ${ctx.ingestedCalories}
      - Cardio: ${ctx.cardioProtocol}
      - Adesão à Dieta: ${ctx.dietCompliance}
      - Qualidade do Sono: ${ctx.sleep}

      ## 🎭 TOM DE VOZ: ${toneInstruction}

      ## 📸 IMAGENS ENVIADAS
      ${imageDescription}

      ## 🧠 ANÁLISE REQUERIDA
      1. **Correlação Visual x Balança:** O peso mudou de ${ctx.weightBefore} para ${ctx.weightAfter}. O visual condiz? 
      2. **Análise por Grupo Muscular:** Compare cada pose. Onde houve ganho real? Onde houve perda de gordura?
      3. **Feedback sobre a Fase:** Para a fase de ${ctx.phase}, o resultado está satisfatório?

      ## ESTRUTURA DE RESPOSTA (Markdown Bonito):
      Use emojis para tópicos.
      # Relatório de Evolução 🚀
      ## 1. Diagnóstico Geral (Peso & Contexto)
      ## 2. Análise Visual (Pose a Pose)
      ## 3. Pontos de Atenção (O que melhorar)
      ## 4. Veredito Final & Ajuste Sugerido
    `;

    const generatedContent = await model.generateContent([prompt, ...imageParts]);
    const response = await generatedContent.response;
    
    return { text: response.text() };

  } catch (error: any) {
    console.error("Erro IA:", error);
    return { error: "Erro ao processar. Tente enviar imagens menores ou em menor quantidade." };
  }
}