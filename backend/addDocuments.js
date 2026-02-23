import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import agentConfig from "./elevenLabs_config.json" with { type: "json" };

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export const addDocuments = async () => {
  console.log("📚 Starte Dokumenten-Upload...");

  try {
    const agentId = agentConfig.agentId;
    if (!agentId || agentId === "NONE") {
      throw new Error("Keine Agent ID gefunden. Bitte erst setupAgent ausführen.");
    }

    const filePath = `${import.meta.dir}/documents/case-study.txt`;
    const file = Bun.file(filePath);
    
    // Prüfen ob Datei existiert
    if (!(await file.exists())) {
        console.log(`⚠️ Datei nicht gefunden: ${filePath}. Überspringe Dokumenten-Upload.`);
        return;
    }

    console.log(`📄 Lade Datei hoch: ${filePath}`);
    
    // Fallback: Text direkt senden, da File-Upload in dieser Umgebung zickt
    const fileContent = await file.text();

    const response = await client.conversationalAi.knowledgeBase.documents.createFromText({
        name: "Case Study Dimitri",
        text: fileContent
    });

    if (!response || !response.id) {
        throw new Error("Fehler beim Erstellen des Dokuments: Keine ID zurückbekommen.");
    }

    const documentId = response.id;
    console.log(`✅ Dokument erstellt! ID: ${documentId}`);

    const newDocEntry = { id: documentId, name: "Case Study Dimitri", type: "file" };

    // Agent updaten und Dokument verknüpfen
    console.log(`🔗 Verknüpfe Dokument mit Agent ${agentId}...`);
    
    await client.conversationalAi.agents.update(agentId, {
        conversationConfig: {
            agent: {
                prompt: {
                    knowledgeBase: [newDocEntry]
                }
            }
        }
    });

    console.log("✅ Dokument erfolgreich mit Agent verknüpft!");

    // Config aktualisieren
    // Wir ersetzen hier einfach die Liste, da wir aktuell nur dieses eine Dokument verwalten.
    agentConfig.conversationConfig.agent.prompt.knowledgeBase = [newDocEntry]; // für mehrere docs anpassen!

    await Bun.write(`${import.meta.dir}/elevenLabs_config.json`, JSON.stringify(agentConfig, null, 2));
    console.log("💾 Config aktualisiert: Dokument gespeichert.");

  } catch (error) {
    console.error("❌ Fehler beim Dokumenten-Upload:", error);
    // Wir werfen den Fehler nicht weiter, damit der Server-Start nicht abbricht, 
    // es sei denn, das ist gewünscht. Hier nur Logging.
  }
};

 addDocuments();