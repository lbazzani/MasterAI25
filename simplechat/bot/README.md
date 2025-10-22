# 🤖 Telegram Bot - SimpleChat Menu Creator

Bot Telegram per gestire ordinazioni di pizze e bevande, integrato con OpenAI per un'esperienza conversazionale.

## 🚀 Setup

### 1. Crea il Bot su Telegram

1. Apri Telegram e cerca **@BotFather**
2. Invia il comando `/newbot`
3. Scegli un nome per il bot (es: "SimpleChat Menu Bot")
4. Scegli un username (deve finire con `bot`, es: "simplechat_menu_bot")
5. **BotFather** ti darà un token, salvalo!

### 2. Configura il Token

Apri il file `.env` nella root del progetto e aggiungi il token:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 3. Installa le dipendenze

```bash
cd simplechat
npm install
```

### 4. Avvia il bot

**In modalità produzione:**
```bash
npm run bot
```

**In modalità sviluppo (con auto-reload):**
```bash
npm run bot:dev
```

## 📱 Come usare il bot

### Comandi disponibili

- `/start` - Messaggio di benvenuto e istruzioni
- `/help` - Mostra il menu completo con prezzi e allergeni
- `/ordine` - Visualizza l'ordine corrente
- `/reset` - Azzera la conversazione e l'ordine

### Esempi di conversazione

**Ordinare:**
```
👤 User: Vorrei una Margherita e una Coca Cola
🤖 Bot: Perfetto! Ho aggiunto al tuo ordine:
      - Margherita (€7.00)
      - Coca Cola (€3.00)
```

**Chiedere informazioni:**
```
👤 User: Quali pizze avete senza glutine?
🤖 Bot: Abbiamo la Birra Senza Glutine...
```

**Modificare ordine:**
```
👤 User: Aggiungi una Birra Bionda
👤 User: Rimuovi la Coca Cola
```

**Confermare ordine:**
```
👤 User: Conferma ordine
🤖 Bot: ✅ ORDINE CONFERMATO!
      📦 Totale articoli: 2
      💰 Totale: €11.00
```

## 🏗️ Architettura

### File principali

- `bot/telegram-bot.ts` - Logica principale del bot
- `data/system-prompt.txt` - Prompt di sistema per OpenAI
- `data/menu.json` - Menu completo con pizze e bevande
- `data/telegram-ordini.json` - Ordini degli utenti (generato automaticamente)

### Sessioni utente

Ogni utente ha la propria sessione in memoria che contiene:
- **messages**: Storico conversazione (ultimi 5 messaggi)
- **orders**: Lista degli articoli ordinati

### Integrazione OpenAI

Il bot usa `gpt-4o-mini` con:
- System prompt personalizzato
- Menu completo caricato dinamicamente
- Contesto dell'ordine corrente
- Response format: JSON strutturato

## 🔧 Configurazione avanzata

### Cambiare il modello OpenAI

Modifica in `telegram-bot.ts`:
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',  // o 'gpt-4-turbo'
  // ...
});
```

### Personalizzare il system prompt

Modifica il file `data/system-prompt.txt` per cambiare il comportamento del bot.

### Aggiungere nuovi comandi

Esempio:
```typescript
bot.onText(/\/miocmd/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Risposta al comando');
});
```

## 🐛 Troubleshooting

### Il bot non risponde

1. Verifica che il token sia corretto in `.env`
2. Controlla i log nella console
3. Verifica la chiave OpenAI

### Errore "polling_error"

Il token potrebbe essere già in uso. Assicurati di:
- Non avere altre istanze del bot in esecuzione
- Non avere webhook configurati su BotFather

### Il bot non ricorda il contesto

Le sessioni sono in memoria. Se riavvii il bot, le sessioni vengono perse.
Per persistenza, implementa il salvataggio su file/database.

## 📚 Risorse

- [Documentazione node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [OpenAI API Docs](https://platform.openai.com/docs)

## 🎯 Features future

- [ ] Persistenza sessioni su database
- [ ] Supporto immagini del menu
- [ ] Notifiche ordine confermato
- [ ] Statistiche ordini
- [ ] Multi-lingua
- [ ] Pagamenti integrati
