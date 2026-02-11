"use server";

import OpenAI from "openai";

const openai = new OpenAI();

export async function transcribeAudio(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("Nenhum arquivo de áudio enviado.");
    }

    // Chama o modelo Whisper-1 (O melhor do mundo em transcrição)
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "pt", // Força português para entender termos técnicos melhor
      prompt: "Contexto de musculação, treino, dieta, hipertrofia, dores articulares." // Ajuda a entender termos específicos
    });

    return { text: transcription.text };

  } catch (error: any) {
    console.error("Erro na transcrição:", error);
    return { error: "Erro ao transcrever áudio." };
  }
}