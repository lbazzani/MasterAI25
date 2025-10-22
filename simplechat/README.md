# 🍕 SimpleChat - Menu Creator

Sistema completo per gestire ordinazioni di pizze e bevande con AI conversazionale.

## 📦 Componenti

### 1. **Web App** (Next.js + Material UI)
Interfaccia web moderna per ordinazioni con chat in tempo reale.

**Features:**
- ✅ Chat conversazionale con AI
- ✅ Auto-scroll messaggi
- ✅ Visualizzazione ordini in tempo reale
- ✅ Design moderno e responsive
- ✅ Colori sobri e professionali

### 2. **Telegram Bot**
Bot Telegram per ordinazioni via mobile.

**Features:**
- ✅ Comandi Telegram nativi
- ✅ Sessioni utente separate e persistenti
- ✅ Menu completo con allergeni
- ✅ Conferma ordini
- ✅ Reset conversazione
- ✅ **Messaggi vocali con trascrizione AI** 🎤

## 🚀 Quick Start

### Web App

```bash
# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev

# Apri browser
# http://localhost:3000
```

### Telegram Bot

```bash
# 1. Configura il token in .env
TELEGRAM_BOT_TOKEN=your_token_here

# 2. Avvia il bot
npm run bot

# oppure con auto-reload
npm run bot:dev
```

📖 **Guida completa**: [TELEGRAM_BOT_SETUP.md](./TELEGRAM_BOT_SETUP.md)

## 📁 Struttura Progetto

```
simplechat/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Pagina principale chat
│   ├── layout.tsx           # Layout app
│   └── api/
│       └── chat/
│           └── route.ts     # API endpoints
├── bot/                      # Telegram Bot
│   ├── telegram-bot.ts      # Logica bot
│   └── README.md            # Documentazione bot
├── data/                     # Dati persistenti
│   ├── system-prompt.txt    # Prompt AI
│   ├── menu.json            # Menu completo
│   ├── messages.json        # Messaggi web (auto-gen)
│   └── ordine.json          # Ordini web (auto-gen)
├── .env                      # Configurazione (non committare!)
├── .env.example              # Template configurazione
└── package.json
```

## 🔧 Configurazione

### File `.env`

```env
# OpenAI API Key
OPENAI_API_KEY=sk-proj-...

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=123456789:ABC...
```

### Menu Prodotti

Modifica `data/menu.json` per aggiornare pizze e bevande:

```json
{
  "menu": {
    "pizze": [
      {
        "nome": "Margherita",
        "descrizione": "Pomodoro, mozzarella...",
        "prezzo": 7.0,
        "allergeni": ["glutine", "latte"]
      }
    ],
    "bevande": [...]
  }
}
```

### System Prompt

Modifica `data/system-prompt.txt` per personalizzare il comportamento dell'AI.

## 💻 Scripts

| Script | Descrizione |
|--------|-------------|
| `npm run dev` | Avvia web app in sviluppo |
| `npm run build` | Build produzione web app |
| `npm run start` | Avvia web app produzione |
| `npm run bot` | Avvia bot Telegram |
| `npm run bot:dev` | Avvia bot con auto-reload |

## 🎨 Design

**Palette Colori:**
- Primary: `#4a5568` (grigio scuro)
- Secondary: `#718096` (grigio medio)
- Background: Gradiente `#e2e8f0` → `#cbd5e0`
- Header: `#2d3748` (grigio antracite)

**UI Components:**
- Border radius: 12px
- Ombre soft e professionali
- Hover effects
- Animazioni smooth

## 🤖 AI Integration

**Modello:** GPT-4o-mini (OpenAI)

**Funzionalità AI:**
- Comprensione linguaggio naturale
- Gestione ordini conversazionale
- Info prodotti e allergeni
- Suggerimenti personalizzati
- Response format: JSON strutturato

## 📱 Web App Features

### Chat
- Messaggi utente (destra, sfondo scuro)
- Messaggi AI (sinistra, sfondo bianco)
- Auto-scroll automatico
- Loading indicator

### Pannello Ordini
- Tabella con piatti ordinati
- Totale articoli e prezzo
- Aggiornamento real-time

### Controlli
- 🔄 Ricarica messaggi
- 🗑️ Reset conversazione
- ⌨️ Input multilinea
- 📤 Invio con Enter

## 🤖 Telegram Bot Commands

| Comando | Descrizione |
|---------|-------------|
| `/start` | Benvenuto e istruzioni |
| `/help` | Menu completo |
| `/ordine` | Visualizza ordine corrente |
| `/reset` | Azzera conversazione |

### Esempi Conversazione

```
👤 Vorrei una Margherita e una Coca Cola
🤖 Perfetto! Ho aggiunto:
   - Margherita (€7.00)
   - Coca Cola (€3.00)

👤 Quali pizze avete senza lattosio?
🤖 Ecco le pizze senza latte:
   - Marinara (€6.00)
   ...

👤 Conferma ordine
🤖 ✅ ORDINE CONFERMATO!
   📦 Totale: 2 articoli
   💰 Totale: €10.00
```

## 🗄️ Data Persistence

**Web App:**
- `messages.json` - Storico chat
- `ordine.json` - Ordini correnti

**Telegram Bot:**
- Sessioni persistenti per utente
- File separati: `telegram-sessions/user_<ID>.json`
- Cache in memoria per performance
- **Persistenza tra riavvii** ✨

📖 Guida completa: [bot/SESSIONS.md](./bot/SESSIONS.md)

## 🔐 Sicurezza

✅ File `.env` escluso da git
✅ Token API non esposti
✅ Validazione input utente
✅ Error handling robusto

## 🚧 Roadmap

- [ ] Database persistente (MongoDB/PostgreSQL)
- [ ] Autenticazione utenti
- [ ] Dashboard admin
- [ ] Statistiche ordini
- [ ] Export ordini (PDF/CSV)
- [ ] Notifiche push
- [ ] Pagamenti integrati
- [ ] Multi-lingua
- [ ] Immagini prodotti

## 📚 Tecnologie

**Frontend:**
- Next.js 15
- React 19
- Material-UI 7
- TypeScript

**Backend:**
- Next.js API Routes
- OpenAI API
- Node.js

**Bot:**
- node-telegram-bot-api
- TypeScript
- ts-node

## 🐛 Troubleshooting

### Web App non parte
```bash
# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install
```

### Bot non risponde
1. Verifica token in `.env`
2. Controlla logs console
3. Verifica chiave OpenAI
4. Controlla che non ci siano altre istanze in esecuzione

### Errori TypeScript
```bash
# Rigenera types
npm run build
```

## 📖 Documentation

- [Setup Bot Telegram](./TELEGRAM_BOT_SETUP.md)
- [Bot Documentation](./bot/README.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Material-UI Docs](https://mui.com/)

## 🤝 Contributi

Progetto di esempio per dimostrare integrazione AI conversazionale con web e Telegram.

## 📄 License

MIT

---

Made with ☕ and 🍕
