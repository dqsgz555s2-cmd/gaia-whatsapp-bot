// ======================================================
// GAIA - WhatsApp Bot Tikalia (versione per Render + Meta)
// ======================================================
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// ------------------------------------------------------
// CONFIG
// ------------------------------------------------------
const VERIFY_TOKEN = "gaia_12345";               // Deve coincidere con il token inserito su Meta
const PAGE_ACCESS_TOKEN = process.env.WHATSAPP_TOKEN; // Inserito su Render come env var
const PHONE_NUMBER_ID = "893079007217754";      // ID numero WhatsApp Business

// ------------------------------------------------------
// RISPOSTA DI GAIA (base)
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
    console.log("❌ Verifica webhook fallita: token o mode non validi");
    return res.sendStatus(403);
  }
});

// ------------------------------------------------------
// WEBHOOK POST (MESSAGGI WHATSAPP IN ARRIVO)
// ------------------------------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const change = body.entry[0].changes[0].value;
      const msg = change.messages[0];
      const from = msg.from;
      const testo = msg.text?.body || "";
      const nome = change.contacts?.[0]?.profile?.name || "utente";

      const risposta = await gaiaRisposta(testo, nome);

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
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Errore Webhook:", err.response?.data || err.message || err);
    res.sendStatus(500);
  }
});

// ------------------------------------------------------
// SERVER COMPATIBILE RENDER
// ------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 GAIA attiva sulla porta ${PORT}`);
});
