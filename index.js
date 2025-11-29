const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "12345"; 
const PAGE_ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;

// Webhook GET
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// Simple GAIA reply
async function gaiaRisposta(testo, nome) {
  return `Buongiorno ${nome}, sono GAIA di Tikalia. Ho ricevuto: "${testo}"`;
}

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    if (
      body.object &&
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages
    ) {
      const msg = body.entry[0].changes[0].value.messages[0];
      const from = msg.from;
      const testo = msg.text?.body || "";
      const nome = "utente";

      const risposta = await gaiaRisposta(testo, nome);

      await axios.post(
        "https://graph.facebook.com/v20.0/PHONE_NUMBER_ID/messages",
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
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Errore Webhook:", err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("GAIA attiva sulla porta " + PORT);
});
