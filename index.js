// ======================================================
// GAIA - WhatsApp Bot Tikalia (Render + Meta STABLE)
// ======================================================
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// ------------------------------------------------------
// CONFIG
// ------------------------------------------------------
const VERIFY_TOKEN = "gaia_12345"; // Deve coincidere con Meta
const PAGE_ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = "893079007217754";

// ------------------------------------------------------
// RISPOSTA DI GAIA (BASE)
// ------------------------------------------------------
async function gaiaRisposta(testo, nome) {
  return `Buongiorno ${nome},
sono GAIA, l'assistente digitale di Tikalia.

Ho ricevuto il tuo messaggio:
"${testo}"

Siamo alla ricerca di immobili in vendita e in acquisto, sia residenziali che commerciali,
nell'area di Cagliari e hinterland. Come posso aiutarti adesso?`;
}

// ------------------------------------------------------
// WEBHOOK GET (VALIDAZIONE META)
// ------------------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✔️ Webhook verificato da Meta");
    return res.status(200).send(challenge);
  } else {
    console.log("❌ Verifica webhook fallita");
    return res.sendStatus(403);
  }
});

// ------------------------------------------------------
// WEBHOOK POST (MESSAGGI IN ARRIVO)
// ------------------------------------------------------
app.post("/webhook", (req, res) => {
  // ✅ rispondi immediatamente a Meta
  res.sendStatus(200);

  try {
    const body = req.body;

    if (
      body.object !== "whatsapp_business_account" ||
      !body.entry?.[0]?.changes?.[0]?.value?.messages
    ) return;

    const value = body.entry[0].changes[0].value;
    const msg = value.messages[0];
    if (msg.type !== "text") return;

    const from = msg.from;
    const testo = msg.text.body;
    const nome = value.contacts?.[0]?.profile?.name || "utente";

    gaiaRisposta(testo, nome).then(async (risposta) => {
      try {
        await axios.post(
          `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            text: { body: risposta }
          },
          {
            headers: {
              Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );
        console.log("✔️ Messaggio inviato a", from);
      } catch (err) {
        console.error("❌ Errore invio:", err.response?.data || err.message);
      }
    });

  } catch (err) {
    console.error("❌ Errore Webhook:", err.message);
  }
});

// ------------------------------------------------------
// AVVIO SERVER (RENDER)
// ------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 GAIA attiva sulla porta ${PORT}`);
});
