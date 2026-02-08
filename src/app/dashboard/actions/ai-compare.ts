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
  goal: string;
  phase: string;
  sleep: string;
  dietCompliance: string;
  // AJUSTE AQUI: Nomes mais claros
  ingestedCalories: string; // Ex: "2500kcal (Dieta)"
  cardioProtocol: string; // Ex: "30min TSD (Gasto)"
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
    if (ctx.tone === "acolhedor") toneInstruction = "Seja empático e motivador.";
    else if (ctx.tone === "tecnico") toneInstruction = "Seja analítico (foco em biomecânica).";
    else toneInstruction = "Seja 'pulso firme' e exigente.";

    const prompt = `
      ATUE COMO UM TREINADOR EXPERT.
      
      ## 📋 DADOS DO ATLETA
      - Nome: ${ctx.name} (${ctx.gender})
      - Idade: ${ctx.age} | Treino: ${ctx.frequency}
      - Lesões: ${ctx.injuries || "Nenhuma"}
      
      ## 🥗 BALANÇO ENERGÉTICO (CRUCIAL)
      - FASE: ${ctx.phase.toUpperCase()}
      - INGESTÃO CALÓRICA (DIETA): ${ctx.ingestedCalories}
      - PROTOCOLO DE CARDIO: ${ctx.cardioProtocol}
      - ADESÃO À DIETA: ${ctx.dietCompliance}
      - SONO: ${ctx.sleep}

      ## 🎭 TOM DE VOZ: ${toneInstruction}

      ## 📸 IMAGENS
      ${imageDescription}

      ## 🧠 ANÁLISE REQUERIDA
      1. Verifique se o físico condiz com a Ingestão de ${ctx.ingestedCalories} e o Cardio de ${ctx.cardioProtocol}.
         Ex: Se come pouco e faz muito cardio, deveria estar secando rápido. Se não está, aponte possível erro na adesão ou metabolismo.
      2. Analise a evolução muscular e de gordura em cada pose.

      ## ESTRUTURA (Markdown):
      # Relatório de Evolução 🚀
      ## 1. Diagnóstico da Fase (${ctx.phase})
      ## 2. Análise por Pose
      ## 3. Pontos Fortes vs Fracos
      ## 4. Veredito Final
    `;

    const generatedContent = await model.generateContent([prompt, ...imageParts]);
    const response = await generatedContent.response;
    
    return { text: response.text() };

  } catch (error: any) {
    console.error("Erro IA:", error);
    return { error: "Erro ao processar. Tente enviar menos fotos." };
  }
}