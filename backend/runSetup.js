
//SIMPLE STARTUP WORKFLOW, DER BEI SERVERSTART AUSGEFÜHRT WIRD, UM AGENT UND TELEFONNUMMER ZU KONFIGURIEREN
import { setupAgent } from "./setupAgent";
import { setupTwilioNumber } from "./setupTwilioPhoneNumber";


await setupAgent();
await setupTwilioNumber(); // kann auch in elevelabs frontend gemacht werden, hier aber als Demo für Backend-Setup