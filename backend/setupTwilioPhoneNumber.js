import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import agentConfig from "./elevenLabs_config.json" with { type: "json" };

const { ELEVENLABS_API_KEY, TWILIO_PHONE_NUMBER, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

Object.entries({ ELEVENLABS_API_KEY, TWILIO_PHONE_NUMBER, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN }).forEach(
    ([key, val]) => {
        if (!val) throw new Error(`⚠️ ${key} fehlt. Bitte in .env eintragen.`);
    }
);

const client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});


const getPhoneNumbers = async () => {
    try {
        const phoneNumbers = await client.conversationalAi.phoneNumbers.list();
        if (!phoneNumbers.length) {
            console.log("No phone numbers found.");
            return false;
        }
        console.log("Phone numbers:", phoneNumbers);
        return phoneNumbers;
    } catch (error) {
        console.error("Error fetching phone numbers:", error);
        throw error;
    }
}
//getPhoneNumbers();


const addTwilioNumber = async () => {

    try {
        const response = await client.conversationalAi.phoneNumbers.create({
            provider: "twilio",
            label: `twilio ${Math.random().toString(16).slice(2, 8)}`,
            phoneNumber: TWILIO_PHONE_NUMBER,
            sid: TWILIO_ACCOUNT_SID,
            token: TWILIO_AUTH_TOKEN,
        });
        if (!response) {
            console.error("Error: No response received from ElevenLabs.");
            throw new Error("Failed to add Twilio number: No response");
        }

        if (!response.phoneNumberId) {
            console.error(`Error: phoneNumberId missing in response`, response);
            throw new Error(`Failed to add Twilio number.`);
        }

        console.log("Twilio number added successfully:", response);
        return response.phoneNumberId;
    } catch (error) {
        console.error("Error adding Twilio number:", error);
        throw error;
    }
}

const assignAgentToNumber = async (phoneNumberId) => {
    try {
        const agentId = agentConfig.agentId;
        if (!agentId || agentId === "NONE") {
            throw new Error("Keine Agent ID in der Config gefunden. Bitte erst setupAgent ausführen.");
        }

        await client.conversationalAi.phoneNumbers.update(phoneNumberId, {
            agentId: agentId,
        });
        console.log(`Agent ${agentId} assigned to phone number id ${phoneNumberId}`);
    } catch (error) {
        console.error("Error assigning agent to phone number:", error);
        throw error;
    }
}

export const setupTwilioNumber = async (forceRecreate = false) => {
    if (!(await getPhoneNumbers()) || forceRecreate) {
        const phoneNumberId = await addTwilioNumber();//only add if no numbers exist
        await assignAgentToNumber(phoneNumberId);
    }
}

//addTwilioNumber();