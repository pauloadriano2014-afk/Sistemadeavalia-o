// Arquivo: test-models.js
// Se não tiver .env.local, tenta pegar a chave direto do processo ou substitua abaixo
const apiKey = "AIzaSyDBaKLijk8Z8-xYzgjwDD1i1hZnz5Nv0cU" || "SUA_CHAVE_AQUI_SE_DER_ERRO_NO_ENV";

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log("🔍 Perguntando ao Google quais modelos estão disponíveis...");
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Erro da API:", data.error.message);
      return;
    }

    if (!data.models) {
      console.log("⚠️ Nenhum modelo encontrado. Verifique se a API Generative Language está ativada no Google Cloud.");
      return;
    }

    console.log("\n✅ MODELOS DISPONÍVEIS PARA SUA CHAVE:");
    console.log("========================================");
    
    // Filtra só os que geram conteúdo (ignora modelos de 'embedding' que não geram texto)
    const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

    chatModels.forEach(model => {
      console.log(`Nome Técnico: ${model.name.replace("models/", "")}`);
      console.log(`Versão: ${model.version}`);
      console.log(`Display: ${model.displayName}`);
      console.log("----------------------------------------");
    });

  } catch (error) {
    console.error("❌ Erro de conexão:", error);
  }
}

listModels();