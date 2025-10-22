# 🚀 Setup Rapido Bot Telegram

## Passi per attivare il bot

### 1️⃣ Crea il bot su Telegram

1. Apri Telegram
2. Cerca `@BotFather`
3. Invia `/newbot`
4. Scegli nome: `SimpleChat Menu Bot`
5. Scegli username: `simplechat_menu_bot` (o simile)
6. **Copia il token** che ti viene fornito

### 2️⃣ Configura il token

Apri il file `.env` e sostituisci:

```env
TELEGRAM_BOT_TOKEN=IL_TUO_TOKEN_QUI
```

### 3️⃣ Installa dipendenze

```bash
npm install
```

### 4️⃣ Avvia il bot

**Modalità produzione (compila e avvia):**
```bash
npm run bot
```

**Modalità sviluppo (con auto-reload):**
```bash
npm run bot:dev
```

### 5️⃣ Testa il bot

1. Cerca il tuo bot su Telegram
2. Invia `/start`
3. Prova a ordinare: "Vorrei una Margherita"

## ✅ Comandi disponibili

| Comando | Descrizione |
|---------|-------------|
| `/start` | Messaggio di benvenuto |
| `/help` | Menu completo |
| `/ordine` | Visualizza ordine corrente |
| `/reset` | Azzera conversazione |

## 💡 Esempi di messaggi

```
Vorrei una Margherita e una Coca Cola
Quali pizze avete senza glutine?
Aggiungi una Birra Bionda
Rimuovi la Coca Cola
Conferma ordine
```

## 🔧 Scripts NPM

```bash
# Avvia bot (produzione)
npm run bot

# Avvia bot (sviluppo con auto-reload)
npm run bot:dev

# Avvia web app
npm run dev
```

## 📱 Funzionalità

✅ Ordinazioni conversazionali con AI
✅ Menu completo con prezzi
✅ Info allergeni
✅ Modifica ordini
✅ Conferma ordine con totale
✅ Reset conversazione
✅ Sessioni utente separate

Ogni utente ha la propria sessione indipendente!
