import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import agentConfig from "./elevenLabs_config.json" with { type: "json" };
import { getCalEventId } from "./cal_com";
import { addDocuments } from "./addDocuments";
import { setupTwilioNumber } from "./setupTwilioPhoneNumber";

// 1. SDK Initialisieren
const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});

const createAgent = async () => {
    try {
        console.log("🆕 Erstelle neuen Agenten...");
        // Explizit nur die benötigten Config-Teile holen
        const { conversationConfig, platformSettings, name } = agentConfig;
        const response = await client.conversationalAi.agents.create({ conversationConfig, platformSettings, name });
        return response.agentId;
    } catch (error) {
        console.error("❌ Fehler beim Erstellen des Agenten:", error);
        throw error;
    }
};

// AKTUELL NUR GENUTZT FÜR CALVOM EVENT ID UPDATE
const updateCalComEventId = async (agentId, calcom_event_id) => {
    console.log(`🛠️ Update Agent ${agentId}...`);

    // Wir senden nur die Änderungen (hier: dynamische Variable)
    await client.conversationalAi.agents.update(agentId, {
        conversationConfig: {
            agent: {
                dynamicVariables: {
                    dynamicVariablePlaceholders: {
                        "calcom_event_id": calcom_event_id
                    }
                }
            }
        }
    });
    console.log(`✅ Agent Config & Variable {{calcom_event_id}} synchronisiert!`);
};

// ==========================================
// AUTO-SETUP FÜR DIE JURY (Wird beim Server-Start ausgeführt)
// ==========================================
export const setupAgent = async (forceRecreate = false) => {
    console.log("🛠️ STARTE AUTO-SETUP...");

    try {
         let agentId = agentConfig.agentId;
        const hasValidId = agentId && agentId.startsWith("agent_");

        // 1. Entscheiden: Erstellen oder Nutzen
        if (hasValidId && !forceRecreate) {
            console.log(`✅ Agent ID bereits in Config gefunden: ${agentId}. Nutze existierenden Agenten.`);
        } else {
            // Erstellen, wenn keine ID da ist ODER forceRecreate true ist
            agentId = await createAgent();
            console.log(`✅ Neuer Agent erstellt! ID: ${agentId}`);

            // ID in Config speichern (Memory & Disk)
            agentConfig.agentId = agentId;
            await Bun.write(`${import.meta.dir}/elevenLabs_config.json`, JSON.stringify(agentConfig, null, 2));
            console.log("💾 Agent ID in Config gespeichert.");
        }

        // 2. Update durchführen (für dynamische Variablen etc.)
        const calEventId = await getCalEventId();
        await updateCalComEventId(agentId, calEventId);
        await addDocuments(); 
        await setupTwilioNumber(forceRecreate);
        console.log("🎉 SETUP ABGESCHLOSSEN! Agent ist bereit.");

    } catch (error) {
        console.log("ℹ️ Setup Info: Fehler aufgetreten");
        throw new Error(error.message || error); // Fehler weiterwerfen, damit es im Setup-Run sichtbar wird
    }
}

setupAgent(true);