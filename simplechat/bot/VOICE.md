# 🎤 Messaggi Vocali - Guida Completa

Il bot supporta messaggi vocali con trascrizione automatica tramite OpenAI Whisper API.

## 🎯 Come Funziona

### Flusso Completo

```
1. 🎤 Utente registra messaggio vocale
2. ⬇️  Bot scarica file audio da Telegram
3. 🔤 OpenAI Whisper trascrive l'audio in testo
4. 📝 Bot mostra la trascrizione all'utente
5. 🤖 Bot processa il testo come messaggio normale
6. 💬 Bot risponde all'ordinazione
7. 🗑️  File audio temporaneo viene cancellato
```

### Esempio Conversazione

```
👤 [Invia messaggio vocale: "Vorrei una Margherita e una Coca Cola"]

🤖 🎧 Sto ascoltando il tuo messaggio vocale...
🤖 📝 Ho capito: "Vorrei una Margherita e una Coca Cola"
🤖 Perfetto! Ho aggiunto al tuo ordine:
   - Margherita (€7.00)
   - Coca Cola (€3.00)
```

## ⚙️ Configurazione Tecnica

### API Utilizzate

1. **Telegram Bot API**
   - `getFileLink(fileId)` - Ottiene URL download file
   - Download file `.ogg` (formato vocale Telegram)

2. **OpenAI Whisper API**
   - Model: `whisper-1`
   - Language: `it` (italiano)
   - Input: Stream audio `.ogg`
   - Output: Testo trascritto

### Directory e File

```
data/
└── telegram-audio/
    ├── voice_1234567890.ogg  (temporaneo)
    ├── voice_1234567891.ogg  (temporaneo)
    └── .gitkeep
```

**Nota**: I file audio sono temporanei e vengono eliminati automaticamente dopo la trascrizione.

## 📊 Log Dettagliati

### Messaggio vocale ricevuto

```
🎤 Messaggio vocale ricevuto da @username (5s)
⬇️  Download audio in corso...
✅ Audio scaricato: /path/to/voice_1234567890.ogg
🔤 Trascrizione in corso...
✅ Trascrizione completata: "Vorrei una Margherita..."
🤖 Chiamata a OpenAI (2 messaggi in sessione)...
✅ Risposta AI ricevuta: 1 articoli nell'ordine
📤 Risposta inviata a @username
```

## 🚀 Performance

| Operazione | Tempo Medio |
|------------|-------------|
| Download audio | ~500ms |
| Trascrizione Whisper | ~2-3s |
| Risposta AI | ~1-2s |
| **Totale** | **~4-6s** |

*Tempo totale dipende dalla durata del messaggio vocale*

## 💡 Vantaggi

✅ **Hands-free**: Ordina mentre fai altro
✅ **Veloce**: Più rapido che scrivere
✅ **Naturale**: Parla come faresti al telefono
✅ **Preciso**: Whisper ha ottima accuratezza per italiano
✅ **Trasparente**: Mostra cosa ha capito

## 🎯 Best Practices

### Per Utenti

**✅ Consigli:**
- Parla chiaramente e a velocità normale
- Usa un ambiente silenzioso
- Messaggi brevi (5-15 secondi) sono più accurati
- Elenca gli articoli uno alla volta

**❌ Evita:**
- Parlare troppo velocemente
- Ambienti molto rumorosi
- Messaggi troppo lunghi (>30s)

### Esempi Efficaci

**Buono:**
```
🎤 "Vorrei ordinare una Margherita e una Coca Cola"
```

**Buono:**
```
🎤 "Aggiungi una Birra Bionda all'ordine"
```

**Ottimo:**
```
🎤 "Conferma ordine per favore"
```

## 🔧 Troubleshooting

### Trascrizione Errata

**Problema**: Bot capisce male alcune parole

**Soluzioni:**
1. Riprova parlando più chiaramente
2. Usa messaggi di testo per nomi complessi
3. Scandisci bene nomi di piatti particolari

### Errore Trascrizione

**Problema**:
```
❌ Mi dispiace, non sono riuscito a capire il messaggio vocale
```

**Cause comuni:**
- Audio troppo corto o vuoto
- Rumore di fondo eccessivo
- Problema temporaneo API Whisper

**Soluzioni:**
1. Riprova a registrare il messaggio
2. Usa un messaggio di testo
3. Controlla connessione internet

### File Audio non Eliminati

**Problema**: Accumulo file in `data/telegram-audio/`

**Causa**: Errore prima della pulizia

**Soluzione manuale:**
```bash
rm data/telegram-audio/voice_*.ogg
```

## 🔐 Privacy e Sicurezza

### Dati Audio

- ✅ File salvati **solo temporaneamente**
- ✅ Eliminati dopo trascrizione
- ✅ Non condivisi con terze parti
- ✅ Processati da OpenAI (vedi policy OpenAI)

### Conformità GDPR

- Audio non persistito oltre elaborazione
- Trascrizione salvata in sessione utente
- Cancellabile con `/reset`

## 💰 Costi OpenAI

### Whisper API Pricing

**Tariffe (2024):**
- $0.006 per minuto audio

**Esempi:**
- Messaggio 5s: ~$0.0005
- Messaggio 15s: ~$0.0015
- Messaggio 30s: ~$0.003

**Stima mensile:**
- 100 messaggi vocali/mese (media 10s): ~$0.10
- 1000 messaggi vocali/mese (media 10s): ~$1.00

*Nota: Costi molto contenuti!*

## 🛠️ Configurazione Avanzata

### Cambiare Lingua

Modifica in `telegram-bot.ts`:

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: fsSync.createReadStream(filePath),
  model: 'whisper-1',
  language: 'en', // Inglese
});
```

Lingue supportate: `it`, `en`, `es`, `fr`, `de`, `pt`, e molte altre.

### Prompt per Trascrizione

Puoi aggiungere un prompt per migliorare l'accuratezza:

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: fsSync.createReadStream(filePath),
  model: 'whisper-1',
  language: 'it',
  prompt: 'Pizze: Margherita, Diavola, Quattro Stagioni...',
});
```

## 📈 Monitoraggio

### Statistiche Utilizzo

Conta messaggi vocali nei log:

```bash
grep "🎤 Messaggio vocale ricevuto" bot.log | wc -l
```

### Tempo Medio Trascrizione

```bash
grep "Trascrizione completata" bot.log
```

### Errori Trascrizione

```bash
grep "ERRORE trascrizione" bot.log
```

## 🔄 Confronto con Messaggi Testo

| Feature | Testo | Vocale |
|---------|-------|--------|
| Velocità input | Medio | Veloce |
| Accuratezza | 100% | ~95% |
| Tempo risposta | ~2s | ~4-6s |
| Hands-free | ❌ | ✅ |
| Costo | Gratis | $0.0006/msg |
| Privacy | Massima | Alta |

## 🚀 Future Improvements

Possibili migliorie:

- [ ] Supporto audio notes (oltre voice messages)
- [ ] Trascrizione real-time (streaming)
- [ ] Rilevamento automatico lingua
- [ ] Risposta vocale (Text-to-Speech)
- [ ] Compressione audio prima upload
- [ ] Cache trascrizioni comuni

## 📚 Risorse

- [OpenAI Whisper API Docs](https://platform.openai.com/docs/guides/speech-to-text)
- [Telegram Voice Messages](https://core.telegram.org/bots/api#voice)
- [Whisper Model Info](https://openai.com/research/whisper)

---

**Implementazione**: [telegram-bot.ts](./telegram-bot.ts#L448-L569)
**Test**: Invia un messaggio vocale al bot! 🎤
