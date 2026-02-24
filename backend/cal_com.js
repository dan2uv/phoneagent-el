const calApiKey = process.env.CALCOM_API_KEY;

export const getCalEventId = async () => {

    if (!calApiKey) throw new Error("Fehlende CALCOM_API_KEY in den Umgebungsvariablen.");

    try {
        const calRes = await fetch(`https://api.cal.com/v1/event-types?apiKey=${calApiKey}`);
        if (!calRes.ok) throw new Error(`HTTP error! status: ${calRes.status}`);

        const calData = await calRes.json();
        if (!calData.event_types?.length) {
            console.log("❌ Keine Cal.com Events.");
            return null;
        }

        const selectedEvent = 
            calData.event_types.find(e => e.length === 30) || 
            calData.event_types.find(e => e.length === 15) || 
            calData.event_types[0];
        const dynamicId = selectedEvent.id.toString();

        console.log(`✅ Cal.com Event ID geladen: ${dynamicId}`);
        return dynamicId;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Cal.com Event ID:", error.message);
        return null;
    }
};
//getCalEventId();
