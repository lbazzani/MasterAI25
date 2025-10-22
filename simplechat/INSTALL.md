# 🔧 Installazione e Avvio

## 📦 Installazione Dipendenze

Prima di tutto, installa tutte le dipendenze necessarie:

```bash
npm install
```

Questo installerà:
- Next.js e React per la web app
- Material-UI per i componenti UI
- OpenAI per l'integrazione AI
- node-telegram-bot-api per il bot Telegram
- tsx per eseguire TypeScript direttamente

## 🌐 Web App

### Modalità Sviluppo

```bash
npm run dev
```

Poi apri [http://localhost:3000](http://localhost:3000) nel browser.

### Modalità Produzione

```bash
npm run build
npm run start
```

## 🤖 Bot Telegram

### Setup Iniziale

1. **Crea il bot su Telegram:**
   - Cerca `@BotFather` su Telegram
   - Invia `/newbot`
   - Scegli nome e username
   - Copia il token fornito

2. **Configura il file .env:**
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Avvio Bot

**Modalità Sviluppo (consigliata, con auto-reload):**
```bash
npm run bot:dev
```

**Modalità Produzione:**
```bash
npm run bot
```

Questo comando:
1. Compila il TypeScript in JavaScript
2. Avvia il bot compilato

### Script Rapido

Puoi anche usare lo script bash per un avvio veloce:

```bash
chmod +x start-bot.sh
./start-bot.sh
```

## 🐛 Risoluzione Problemi

### Errore "Unknown file extension .ts"

**Soluzione:** Usa `npm run bot:dev` invece di `npm run bot` durante lo sviluppo.

Se vuoi usare `npm run bot`:
1. Assicurati che `tsx` sia installato: `npm install`
2. Il bot verrà prima compilato e poi eseguito

### Errore "Cannot find module"

```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install
```

### Bot non risponde

1. Verifica il token in `.env`
2. Controlla i log nella console
3. Assicurati che non ci siano altre istanze in esecuzione
4. Verifica la chiave OpenAI

### Errore di compilazione TypeScript

```bash
# Rigenera i file di configurazione
npm run bot:build
```

## 📝 Note

- **Web App e Bot** possono girare contemporaneamente
- **Port 3000** è usato dalla web app
- **Bot Telegram** non usa porte, si connette ai server Telegram
- **Sessioni Bot** sono in memoria (si perdono al riavvio)
- **Sessioni Web** sono salvate in `data/messages.json`

## 🔄 Workflow Sviluppo

### Sviluppo parallelo Web + Bot

Usa due terminali:

**Terminal 1 - Web App:**
```bash
npm run dev
```

**Terminal 2 - Bot:**
```bash
npm run bot:dev
```

Entrambi si riavvieranno automaticamente quando modifichi i file!

## 📚 Struttura Scripts

| Script | Uso | Quando usarlo |
|--------|-----|---------------|
| `npm run dev` | Web app sviluppo | Sempre durante sviluppo web |
| `npm run build` | Build web produzione | Prima del deploy |
| `npm run start` | Avvia web produzione | Dopo build |
| `npm run bot:dev` | Bot sviluppo | Sempre durante sviluppo bot |
| `npm run bot:build` | Compila bot | Manuale, opzionale |
| `npm run bot` | Bot produzione | Deploy bot su server |

## ✅ Checklist Setup Completo

- [ ] `npm install` eseguito con successo
- [ ] File `.env` configurato con entrambi i token
- [ ] Web app avviata e accessibile su localhost:3000
- [ ] Bot Telegram creato con @BotFather
- [ ] Token bot aggiunto in `.env`
- [ ] Bot avviato con `npm run bot:dev`
- [ ] Bot risponde al comando `/start` su Telegram
- [ ] Ordinazione di test completata con successo

Tutto pronto! 🎉
