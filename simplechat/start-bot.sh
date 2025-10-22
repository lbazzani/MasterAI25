#!/bin/bash

echo "🤖 Avvio Bot Telegram SimpleChat..."
echo ""

# Verifica che esista il file .env
if [ ! -f .env ]; then
    echo "❌ File .env non trovato!"
    echo "📝 Copia .env.example in .env e configura i token"
    exit 1
fi

# Verifica che il token sia configurato
if grep -q "your_telegram_bot_token_here" .env; then
    echo "⚠️  ATTENZIONE: Token Telegram non configurato!"
    echo ""
    echo "📱 Per configurare il bot:"
    echo "1. Cerca @BotFather su Telegram"
    echo "2. Crea un nuovo bot con /newbot"
    echo "3. Copia il token nel file .env"
    echo ""
    exit 1
fi

# Verifica node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installazione dipendenze..."
    npm install
fi

echo "✅ Configurazione OK"
echo "🚀 Avvio bot in modalità sviluppo (con auto-reload)..."
echo "💡 Per modalità produzione usa: npm run bot"
echo ""

npm run bot:dev
