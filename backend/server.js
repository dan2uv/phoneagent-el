// backend/server.js
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import agentConfig from "./elevenLabs_config.json" with { type: "json" };


const PORT = 8000;

// 1. SDK Initialisieren
const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});

console.log(`🚀Bun Backend läuft auf http://localhost:${PORT}`);

const agentId = agentConfig.agentId;
const hasValidId = agentId && agentId.startsWith("agent_");
if (!hasValidId) {
    throw new Error("⚠️ Keine gültige Agent ID in Config gefunden. Bitte setupAgent ausführen, um den Agenten zu erstellen und die ID zu speichern.");
}
console.log(`Starte Server hole Daten basierend auf: Aktueller Agent ID aus Config: ${agentId}`);

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
        console.log(`Incoming Request: ${req.method} ${url.pathname}`);

        // NEUER ENDPUNKT: Audio Streamen (Komplett laden für bessere Player-UX)
        if (url.pathname.startsWith("/api/audio/") && req.method === "GET") {
            const conversationId = url.pathname.split("/api/audio/")[1];
            try {
                const audioStream = await client.conversationalAi.conversations.audio.get(conversationId);
                
                // Stream in Buffer umwandeln
                const audioBuffer = await new Response(audioStream).arrayBuffer();
                const total = audioBuffer.byteLength;

                // Range Request Support für Seeking
                const range = req.headers.get("Range");

                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
                    const chunksize = (end - start) + 1;
                    const file = audioBuffer.slice(start, end + 1);

                    return new Response(file, {
                        status: 206,
                        headers: {
                            "Content-Range": `bytes ${start}-${end}/${total}`,
                            "Accept-Ranges": "bytes",
                            "Content-Length": chunksize.toString(),
                            "Content-Type": "audio/mpeg",
                            "Access-Control-Allow-Origin": "*",
                        }
                    });
                } else {
                    return new Response(audioBuffer, {
                        headers: {
                            "Content-Type": "audio/mpeg",
                            "Content-Length": total.toString(),
                            "Accept-Ranges": "bytes",
                            "Access-Control-Allow-Origin": "*",
                        }
                    });
                }
            } catch (error) {
                console.error("Audio Fehler:", error);
                return new Response("Audio nicht gefunden", { status: 404 });
            }
        }

        // NEUER ENDPUNKT: Einzelne Call-Details abrufen
        if (url.pathname.startsWith("/api/call/") && req.method === "GET") {
            const conversationId = url.pathname.split("/api/call/")[1];
            console.log(`Fetching details for ID: ${conversationId}`);

            try {
                const call = await client.conversationalAi.conversations.get(conversationId);
                
                // Daten aus Analysis extrahieren
                const analysis = call.analysis;
                let leadScore = "N/A";
                let dropOffReason = "Unbekannt";

                if (analysis && analysis.dataCollectionResults) {
                    const dc = analysis.dataCollectionResults;
                    
                    if (Array.isArray(dc)) {
                        // Fall: Array (data_collection_results_list)
                        const lsItem = dc.find(d => d.dataCollectionId === "lead_score");
                        const doItem = dc.find(d => d.dataCollectionId === "drop_off_reason");
                        leadScore = lsItem?.value || "N/A";
                        dropOffReason = doItem?.value || "Unbekannt";
                    } else {
                        // Fall: Objekt (data_collection_results) - SDK nutzt oft camelCase Keys
                        leadScore = dc.lead_score?.value || dc.leadScore?.value || "N/A";
                        dropOffReason = dc.drop_off_reason?.value || dc.dropOffReason?.value || "Unbekannt";
                    }
                }
                
                // Summary robust extrahieren (SDK vs API Response)
                const summary = call.transcriptSummary || analysis?.transcriptSummary || analysis?.transcript_summary || "Keine Zusammenfassung verfügbar.";
                
                const details = {
                    id: call.conversationId,
                    status: call.callSuccessful === "success" ? "Demo gebucht" : "Abgebrochen",
                    score: leadScore,
                    summary: summary,
                    dropOffReason: dropOffReason,
                    audioUrl: `http://localhost:8000/api/audio/${call.conversationId}`
                };

                return new Response(JSON.stringify(details), {
                    headers: { ...headers, "Content-Type": "application/json" }
                });

            } catch (error) {
                console.error("Fehler beim Abrufen der Call-Details:", error);
                return new Response(JSON.stringify({ error: "Call nicht gefunden" }), {
                    status: 404,
                    headers: { ...headers, "Content-Type": "application/json" }
                });
            }
        }

        // NEUER ENDPUNKT: Analytics (Aggregierte Daten mit Detail-Abfrage)
        if (url.pathname === "/api/analytics" && req.method === "GET") {
            try {
                // 1. Liste der letzten Calls holen
                const listResp = await client.conversationalAi.conversations.list({
                    agentId: agentId,
                    pageSize: 15, // Limitieren für Performance
                });
                const conversations = listResp.conversations || [];

                // 2. Details parallel abrufen (Promise.all)
                const detailsPromises = conversations.map(c => 
                    client.conversationalAi.conversations.get(c.conversationId)
                        .catch(e => null) // Fehler bei einzelnem Call ignorieren
                );
                const detailsResults = await Promise.all(detailsPromises);

                // 3. Drop-off Gründe & Lead Scores aggregieren
                const dropOffCounts = {};
                const leadScoreCounts = { A: 0, B: 0, C: 0 };
                let totalAnalyzed = 0;
                let realDropOffs = 0;
                
                detailsResults.forEach(call => {
                    if (!call || !call.analysis) return;
                    
                    totalAnalyzed++;
                    const dc = call.analysis.dataCollectionResults;
                    let reason = null;
                    let score = null;

                    if (Array.isArray(dc)) {
                        const item = dc.find(d => d.dataCollectionId === "drop_off_reason");
                        reason = item?.value;
                        
                        const scoreItem = dc.find(d => d.dataCollectionId === "lead_score");
                        score = scoreItem?.value;
                    } else if (dc) {
                        reason = dc.drop_off_reason?.value || dc.dropOffReason?.value;
                        score = dc.lead_score?.value || dc.leadScore?.value;
                    }

                    // Drop-off Logik
                    if (reason && reason !== "Termin gebucht") {
                        dropOffCounts[reason] = (dropOffCounts[reason] || 0) + 1;
                        realDropOffs++;
                    }

                    // Lead Score Logik
                    if (score && ["A", "B", "C"].includes(score)) {
                        leadScoreCounts[score]++;
                    }
                });

                // Sortieren
                const sortedDropOffs = Object.entries(dropOffCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([reason, count]) => ({ reason, count }));

                return new Response(JSON.stringify({ 
                    dropOffs: sortedDropOffs,
                    stats: { total: totalAnalyzed, dropOffs: realDropOffs },
                    leadScores: leadScoreCounts
                }), {
                    headers: { ...headers, "Content-Type": "application/json" }
                });

            } catch (error) {
                console.error("Analytics API Fehler:", error);
                return new Response(JSON.stringify({ error: "Fehler bei Analytics" }), {
                    status: 500,
                    headers: { ...headers, "Content-Type": "application/json" }
                });
            }
        }

        if (url.pathname === "/api/dashboard" && req.method === "GET") {
            try {
                const response = await client.conversationalAi.conversations.list({
                    // Korrekte Env-Variable genutzt:
                    agentId: agentId,
                  //  pageSize: 20,
                });

                const conversations = response.conversations || [];

                let totalDuration = 0;
                let successCount = 0;

                // 3. Datenmapping für das Frontend
                const recentCalls = conversations.map(call => {
                    const durationSecs = call.callDurationSecs || 0;
                    totalDuration += durationSecs;

                    const isSuccess = call.callSuccessful === "success";
                    if (isSuccess) successCount++;

                    // Zeit formatieren
                    const startTime = call.startTimeUnixSecs || Math.floor(Date.now() / 1000);
                    const dateObj = new Date(startTime * 1000);
                    const formattedDate = dateObj.toLocaleString('de-DE', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    });

                    const mins = Math.floor(durationSecs / 60);
                    const secs = durationSecs % 60;

                    // ID formatieren
                    const convId = call.conversationId || "Unbekannt";
                    const displayId = convId !== "Unbekannt" ? convId.substring(0, 8) + "..." : "---";

                    return {
                        id: convId, // Echte ID für den Detail-Abruf
                        displayId: displayId,
                        date: formattedDate,
                        duration: `${mins}m ${secs}s`,
               
                        status: isSuccess ? "Demo gebucht" : "Abgebrochen",
                        // Details werden jetzt separat geladen
                        details: {
                            summary: "Lade Details...",
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

                // 5. Cal.com Bookings holen (Nächste 3 Tage)
                let upcomingDemos = [];
                const calApiKey = process.env.CALCOM_API_KEY;
                
                if (!calApiKey) {
                    console.log("⚠️ Kein Cal.com API Key konfiguriert.");
                    upcomingDemos = [{ error: "missing_api_key" }];
                } else {
                    try {
                        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                        const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        
                        console.log(`Fetching Cal.com bookings from ${today} to ${threeDaysLater}...`);
                        
                        const calRes = await fetch(`https://api.cal.com/v1/bookings?apiKey=${calApiKey}&status=upcoming&dateFrom=${today}&dateTo=${threeDaysLater}`);
                        
                        if (!calRes.ok) {
                            console.error(`Cal.com API Error: ${calRes.status} ${calRes.statusText}`);
                            const errText = await calRes.text();
                            console.error("Cal.com Error Body:", errText);
                            upcomingDemos = [{ error: "api_error", message: `API Error: ${calRes.status}` }];
                        } else {
                            const calData = await calRes.json();
                            console.log(`Cal.com Bookings Found: ${calData.bookings?.length || 0}`);
                            
                            if (calData.bookings) {
                                upcomingDemos = calData.bookings.map(b => ({
                                    id: b.id,
                                    company: b.title || "Demo Termin",
                                    date: new Date(b.startTime).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' }),
                                    contact: b.attendees[0]?.name || "Unbekannt",
                                    calendarLink: b.meetingUrl || "#" 
                                }));
                            }
                        }
                    } catch (e) {
                        console.error("Cal.com Fehler:", e);
                        upcomingDemos = [{ error: "network_error", message: e.message }];
                    }
                }

                const dashboardStats = {
                    kpis: {
                        conversionRate: conversionRate,
                        avgDuration: `${avgMins}m ${avgSecs}s`,
                        leadQuality: { A: successCount, B: 0, C: conversations.length - successCount },
                        // Drop-offs entfernt, da jetzt im Analytics Tab
                    },
                    upcomingDemos: upcomingDemos,
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