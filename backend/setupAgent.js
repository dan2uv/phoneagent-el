import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import agentConfig from "./elevenLabs_config.js";

// 1. SDK Initialisieren
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY, 
});// ==========================================
// AUTO-SETUP FÜR DIE JURY (Wird beim Server-Start ausgeführt)
// ==========================================
// ==========================================
// AUTO-SETUP FÜR DIE JURY (Wird beim Server-Start ausgeführt)
// ==========================================
const setupAgentConfig = async () => {
  console.log("🛠️ STARTE AUTO-SETUP...");

  try {
    const calApiKey = process.env.CALCOM_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!calApiKey || !agentId) return console.warn("⚠️ Keys fehlen. Setup übersprungen.");

    // 1. Cal.com Event-ID holen
    const calRes = await fetch(`https://api.cal.com/v1/event-types?apiKey=${calApiKey}`);
    const calData = await calRes.json();
    if (!calData.event_types?.length) return console.log("❌ Keine Cal.com Events.");

    // Suche 30-Min Termin oder nimm den ersten
    const event = calData.event_types.find(e => e.length === 30) || calData.event_types[0];
    
     const dynamicId = event.id.toString(); 
    console.log(`✅ Cal.com Event ID geladen: ${dynamicId}`);

    // 2. Update senden (VIEL SAUBERER!)
    // Wir setzen einfach die Variable im 'dynamic_variable_placeholders' Objekt
   await client.conversationalAi.agents.update(agentId, {
      conversationConfig: {
        agent: {
          name: agentConfig.agent.name,
          language: agentConfig.agent.language,
          firstMessage: agentConfig.agent.firstMessage,
          prompt: {
            prompt: agentConfig.agent.prompt.prompt, 
            llm: agentConfig.agent.prompt.llm,
            temperature: agentConfig.agent.prompt.temperature,
            maxTokens: agentConfig.agent.prompt.maxTokens,
            knowledgeBase: agentConfig.agent.prompt.knowledgeBase
          },
          dynamicVariables: {
            dynamicVariablePlaceholders: {
              "calcom_event_id": dynamicId 
            }
          }
        },
        tts: agentConfig.tts,
        conversation: agentConfig.conversation
      },
      // HIER EINFACH DIREKT ÜBERGEBEN (Kein Absichern nötig!)
      platformSettings: {
        dataCollection: agentConfig.platformSettings.dataCollection
      }
    });

    console.log(`✅ Agent Config & Variable {{calcom_event_id}} synchronisiert!`);

  } catch (error) {
    console.log("ℹ️ Setup Info: Update übersprungen (API Fehler ");
    console.error(error); // Zum Debuggen falls doch was klemmt
  }
}
// setupAgentPrompt();