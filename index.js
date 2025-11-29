const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

/* ----------------------------------------------------
   CONFIG
---------------------------------------------------- */
const VERIFY_TOKEN = "12345";   // token di verifica webhook
const PAGE_ACCESS_TOKEN = 
"EAAWBrN9qWiwBQJuoaG9CuL4te6LCrQMlMmZBR1Xdx4RYs1pitn9LIZCaevYTsCu7sW3loEGrkwiu6fqjZBb9mXhL2WryJomPkYiVMjCH8Q5QRY79J7ea6OxPyXv82dN5NjCIjg96pLO8v2ZBZBdRqQzqfxev6kCziXBzZCpZA1k7ZAtBZBFGzIsIrelrly6t9j2hY1MCD9PXWzdZBGNg4sh0DJYs5uRBzWggSstg9EXGHF4bVO39So13L6DKsyY1kVCuhNdr4EbO6uOmfTYdEN6wZDZD";

/* ----------------------------------------------------
   AI RISPOSTA - GAIA
---------------------------------------------------- */
async function gaiaRisposta(testomsg, nome) {

  return `
Buonasera ${nome},  
sono **GAIA**, l’assistente intelligente di **Tikalia**.

📌 Ho ricevuto il tuo messaggio:  
“${testomsg}”

Siamo alla ricerca costante di **immobili in vendita e in acquisto**, sia **residenziali** che **commerciali**, per soddisfare la 
domanda crescente dei nostri clienti — inclusi progetti di rilievo nel territorio di Cagliari e hinterland.

Se desideri:
• valutare la vendita o locazione del tuo immobile  
• ricevere una stima professionale  
• proporre un immobile di un amico/parente  
• oppure fissare un appuntamento con un consulente Tikalia  

sono qui per aiutarti subito.

Puoi dirmi liberamente di cosa hai bisogno ✨  
  `.trim();
}

/* ----------------------------------------------------
   INVIO MESSAGGIO WHATSAPP
---------------------------------------------------- */
async function sendMessage(to, text) {
  try {
    await axios({
      method: "POST",
      url: "https://graph.facebook.com/v18.0/893079007217754/messages",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`
      },
      data: {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text }
      }
    });

    console.log("✔️ Risposta inviata");
  } catch (err) {
    console.log("❌ Errore invio risposta:", err.response?.data || err);
  }
}

/* ----------------------------------------------------
   WEBHOOK GET (Verifica Meta)
---------------------------------------------------- */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificato ✔️");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/* ----------------------------------------------------
   WEBHOOK POST (Messaggi WhatsApp)
---------------------------------------------------- */
app.post("/webhook", async (req, res) => {
  console.log("📩 Messaggio ricevuto:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return;

    const from = message.from;
    const text = message.text?.body || "";
    const nome = changes?.value?.contacts?.[0]?.profile?.name || "gentile utente";

    //  GAIA CREA RISPOSTA
    const risposta = await gaiaRisposta(text, nome);

    //  INVIO
    await sendMessage(from, risposta);

  } catch (err) {
    console.log("Errore gestione messaggio:", err);
  }
});

/* ----------------------------------------------------
   SERVER
---------------------------------------------------- */
app.listen(3000, () => {
  console.log("🚀 GAIA ABCDE ATTIVA sulla porta 3000");
});
