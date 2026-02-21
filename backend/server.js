// backend/server.js
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const PORT = 8000;

// 1. SDK Initialisieren
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY, 
});

console.log(`🚀 Sicheres Bun Backend läuft auf http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  async fetch(req) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") return new Response(null, { headers });

    const url = new URL(req.url);

    if (url.pathname === "/api/dashboard" && req.method === "GET") {
      try {
        const response = await client.conversationalAi.conversations.list({
          // Korrekte Env-Variable genutzt:
          agentId: process.env.ELEVENLABS_AGENT_ID, 
          pageSize: 20, 
        });

        const conversations = response.conversations || [];

        let totalDuration = 0;
        let successCount = 0;

        // 3. Strikte Typisierung: Nur die echten camelCase Properties des SDKs nutzen!
        const recentCalls = conversations.map(call => {
          
          // Wir vertrauen dem SDK, dass callDurationSecs existiert (Fallback nur für leere Daten)
          const durationSecs = call.callDurationSecs || 0;
          totalDuration += durationSecs;
          
          const isSuccess = call.callSuccessful === "success";
          if (isSuccess) successCount++;

          // Zeit formatieren
          const startTime = call.startTimeUnixSecs || Math.floor(Date.now() / 1000);
          const dateObj = new Date(startTime * 1000);
          const formattedDate = dateObj.toLocaleString('de-DE', { 
            day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' 
          });

          const mins = Math.floor(durationSecs / 60);
          const secs = durationSecs % 60;

          // ID strikt auslesen
          const convId = call.conversationId || "Unbekannt";
          const displayId = convId !== "Unbekannt" ? convId.substring(0, 8) + "..." : "---";

          const summary = call.transcriptSummary || "Keine Zusammenfassung verfügbar.";

          return {
            id: displayId,
            date: formattedDate,
            duration: `${mins}m ${secs}s`,
            score: isSuccess ? "A" : "C", 
            status: isSuccess ? "Demo gebucht" : "Abgebrochen",
            details: {
              budget: isSuccess ? "> 1.000€" : "Unbekannt",
              crmSize: "Wird aus Gespräch analysiert...",
              summary: summary,
              audioUrl: "#" 
            }
          };
        });

        // 4. Berechne echte KPIs
        const avgDurationSecs = conversations.length > 0 ? Math.floor(totalDuration / conversations.length) : 0;
        const avgMins = Math.floor(avgDurationSecs / 60);
        const avgSecs = avgDurationSecs % 60;
        
        const conversionRate = conversations.length > 0 
          ? ((successCount / conversations.length) * 100).toFixed(1) + "%"
          : "0%";

        const dashboardStats = {
          kpis: {
            conversionRate: conversionRate,
            avgDuration: `${avgMins}m ${avgSecs}s`,
            leadQuality: { A: successCount, B: 0, C: conversations.length - successCount },
            dropOffs: ["Zu teuer (Platzhalter)"] 
          },
          upcomingDemos: [],
          recentCalls: recentCalls
        };

        return new Response(JSON.stringify(dashboardStats), {
          headers: { ...headers, "Content-Type": "application/json" }
        });

      } catch (error) {
        console.error("ElevenLabs API Fehler:", error);
        return new Response(JSON.stringify({ error: "Fehler beim Abrufen der Calls" }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not Found", { status: 404, headers });
  },
});