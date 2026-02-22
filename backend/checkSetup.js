// check-setup.js
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const agentId = process.env.ELEVENLABS_AGENT_ID;

async function check() {
  console.log("🔍 Prüfe Agenten-Konfiguration...");
  const agent = await client.conversationalAi.agents.get(agentId);
  
  // Wir schauen tief in das Agent-Objekt
  const variables = agent.conversationConfig.agent.dynamicVariables;
  
  console.log("------------------------------------------------");
  console.log("PROMPT TEXT (Ausschnitt):");
  // Zeige die letzten 100 Zeichen des Prompts (wo die Variable steht)
  console.log("..." + agent.conversationConfig.agent.prompt.prompt.slice(-150));
  
  console.log("\nVERSTECKTE WERTE (Die Magie):");
  console.log(variables); 
  console.log("------------------------------------------------");
  
  if (variables && variables.dynamicVariablePlaceholders["calcom_event_id"]) {
      console.log("✅ ERFOLG: Die ID ist hinterlegt und wird im Call ersetzt!");
  } else {
      console.log("❌ FEHLER: Keine Variable gefunden.");
  }
}

check();