# 📊 Guida ai Log del Bot Telegram

Il bot ora include log dettagliati per monitorare tutte le attività.

## 🎯 Log all'Avvio

```
🤖 Bot Telegram avviato con successo!
📡 Token: 8441213582...
🎯 Bot in ascolto dei messaggi...
```

## 📥 Log Comandi

### /start
```
📥 /start ricevuto da @username (ID: 123456789)
✅ Messaggio di benvenuto inviato a @username
```

### /help
```
📥 /help ricevuto da @username
✅ Menu completo inviato a @username (20 pizze, 20 bevande)
```

### /ordine
```
📥 /ordine ricevuto da @username (ID: 123456789)
✅ Ordine inviato a @username: 3 articoli, €25.50
```

oppure se l'ordine è vuoto:
```
📋 Ordine vuoto per @username
```

### /reset
```
📥 /reset ricevuto da @username (ID: 123456789)
🗑️ Sessione azzerata per @username
```

## 💬 Log Messaggi Conversazionali

### Messaggio utente
```
💬 Messaggio da @username: "Vorrei una Margherita e una Coca Cola"
```

### Chiamata AI
```
🤖 Chiamata a OpenAI (2 messaggi in sessione)...
✅ Risposta AI ricevuta: 2 articoli nell'ordine
📤 Risposta inviata a @username
```

### Ordine confermato
```
🎉 Ordine confermato per @username! Totale: €10.00
```

## 📊 Log Periodici (ogni 5 minuti)

```
📊 Sessioni attive: 3
   👤 User 123456789: 4 messaggi, 2 articoli
   👤 User 987654321: 2 messaggi, 0 articoli
   👤 User 555555555: 6 messaggi, 5 articoli
```

## ❌ Log Errori

### Errore generico
```
❌ ERRORE per @username: Failed to connect
Stack: Error: Failed to connect
    at ...
```

### Errore polling
```
⚠️  Polling error: EFATAL: Token not provided
```

### Errore menu
```
❌ Errore nel leggere il menu: ENOENT: no such file
```

## 🔍 Interpretare i Log

### ✅ Bot funzionante correttamente
Dovresti vedere:
- ✅ Messaggi "inviato a" dopo ogni comando
- 🤖 Chiamate OpenAI completate
- 📤 Risposte inviate

### ⚠️  Problemi comuni

**Nessun log dopo l'avvio:**
- Il token potrebbe essere errato
- Controlla connessione internet

**Errori OpenAI:**
```
❌ ERRORE: Invalid API key
```
Soluzione: Verifica `OPENAI_API_KEY` in `.env`

**Timeout OpenAI:**
```
❌ ERRORE: Timeout waiting for response
```
Soluzione: Riprova, potrebbe essere un problema temporaneo

**Menu non trovato:**
```
❌ Errore nel leggere il menu: ENOENT
```
Soluzione: Verifica che esista `data/menu.json`

## 🛠️ Debug Avanzato

### Aumentare il livello di dettaglio

Modifica `telegram-bot.ts` per aggiungere più log:

```typescript
// Prima della chiamata OpenAI
console.log('Prompt:', enhancedSystemPrompt.substring(0, 200));

// Dopo la risposta
console.log('Risposta raw:', responseContent);
```

### Monitorare memoria

```typescript
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`💾 Memoria: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
}, 60000); // Ogni minuto
```

## 📈 Metriche Utili

Dal log puoi tracciare:
- **Utenti attivi**: Conteggio sessioni uniche
- **Ordini completati**: Conteggio messaggi "🎉 Ordine confermato"
- **Tasso di conversione**: Ordini / Messaggi totali
- **Prodotti più ordinati**: Analizza i log degli ordini

## 💡 Tips

1. **Redirect output su file:**
   ```bash
   npm run bot:dev > bot.log 2>&1
   ```

2. **Filtrare solo errori:**
   ```bash
   npm run bot:dev 2>&1 | grep "❌"
   ```

3. **Monitorare in tempo reale:**
   ```bash
   tail -f bot.log
   ```

4. **Contare ordini confermati:**
   ```bash
   grep "🎉 Ordine confermato" bot.log | wc -l
   ```
