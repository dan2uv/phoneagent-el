import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
async function main() {

  const resp =  await client.conversationalAi.conversations.audio.get("conv_9601kj8e90q6fyqswhzwpzm75ewp");
    console.log("Audio URL:", resp);
}
main();