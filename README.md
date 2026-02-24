# 🤖 Agent Dashboard & Auto-Setup

Dieses Projekt automatisiert die Erstellung und Konfiguration eines **ElevenLabs AI Voice Agenten** inklusive **Twilio-Telefonnummer** und **Cal.com-Integration**.

## 🚀 Schnellstart (Production)

Das gesamte Setup wird automatisch beim Start des Docker-Containers ausgeführt.

1. **Umgebungsvariablen setzen**:
   Erstelle eine `.env` Datei basierend auf `.env.example` und fülle alle Werte aus.
   
   **WICHTIG für Production:**
   Setze `VITE_API_URL` auf die öffentliche IP deines Servers (inkl. Port 8000), damit das Frontend (im Browser des Users) das Backend erreichen kann.
   ```env
   VITE_API_URL=http://DEINE_SERVER_IP:8000
   ```

2. **Container starten**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```



## ⚙️ Was passiert im Hintergrund?

Sobald der Container startet, wird das Skript `setupAgent.js` ausgeführt. Folgende Schritte laufen vollautomatisch ab:

1.  **Agent Erstellung/Update**: 
    *   Es wird geprüft, ob bereits eine Agent-ID in der `elevenLabs_config.json` existiert.
    *   Falls nicht, wird ein neuer Agent basierend auf der Konfiguration erstellt.
    *   Falls ja, wird der bestehende Agent aktualisiert.
2.  **Wissensdatenbank**:
    *   Die Case-Study (`documents/case-study.txt`) wird hochgeladen und mit dem Agenten verknüpft.
3.  **Telefonie-Setup**:
    *   Eine Twilio-Telefonnummer wird konfiguriert und dem Agenten zugewiesen.
4.  **Tool-Konfiguration**:
    *   Die korrekte `calcom_event_id` wird dynamisch ermittelt und in den Agenten-Prompt injiziert.

---

## ⚠️ WICHTIG: Manuelle Schritte nach dem Setup

Da die **Cal.com Integration** aus Sicherheitsgründen nicht vollständig über die API aktiviert werden kann, sind **einmalig** manuelle Schritte notwendig:

1. **Integration aktivieren**:
   * Logge dich in deinen [ElevenLabs Account](https://elevenlabs.io/app/agents) ein.
   * Navigiere zu **Agents** -> Wähle den erstellten Agenten ("Lead agent Alex - Pro") aus.
   * Gehe auf den Reiter **Integrations** (oder "Analysis" -> "Integrations").
   * Suche nach **Cal.com** und klicke auf "Connect" / "Setup".
   * **Hinterlege dort deinen Cal.com API Key.**

2. **Tools hinzufügen**:
   * Gehe zurück zur Agenten-Übersicht ("Lead agent Alex - Pro").
   * Klicke auf den Bereich **Tools**.
   * Füge **alle verfügbaren Cal.com Tools** hinzu (z.B. `calcom_create_booking`, `calcom_check_availability` etc.), damit der Agent Termine buchen kann.

Erst danach kann der Agent erfolgreich Termine buchen!