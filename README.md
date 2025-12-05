# GAIA WhatsApp Bot (Tikalia)

Questo progetto contiene un semplice bot WhatsApp (GAIA) ospitato su Render, collegato a WhatsApp Cloud API.

## File principali

- `index.js` — Server Express con:
  - endpoint GET `/webhook` per la verifica Meta
  - endpoint POST `/webhook` per i messaggi WhatsApp
- `package.json` — Configurazione Node/Render

## Variabili d'ambiente (da impostare su Render)

- `WHATSAPP_TOKEN` — il token lungo di Meta (EAA...)
- `PORT` — opzionale, Render la imposta automaticamente

## Verifica webhook

URL callback:
`https://IL-NOME-DEL-SERVIZIO.onrender.com/webhook`

Verify token:
`gaia_12345`
