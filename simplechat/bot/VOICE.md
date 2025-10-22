# 🎤 Messaggi Vocali - Guida Completa

Il bot supporta messaggi vocali bidirezionali con trascrizione (Speech-to-Text) e sintesi vocale (Text-to-Speech).

## 🎯 Come Funziona

### Flusso Completo con Risposta Vocale

```
1. 🎤 Utente registra messaggio vocale
2. ⬇️  Bot scarica file audio da Telegram
3. 🔤 OpenAI Whisper trascrive l'audio in testo
4. 📝 Bot mostra la trascrizione all'utente
5. 🤖 Bot processa il testo come messaggio normale
6. 🔊 Bot genera audio della risposta (TTS)
7. 🎧 Bot invia messaggio vocale come risposta
8. 🗑️  File audio temporanei vengono cancellati
```

### Esempio Conversazione

```
👤 🎤 [Vocale: "Vorrei una Margherita e una Coca Cola"]

🤖 🎧 Sto ascoltando il tuo messaggio vocale...
🤖 📝 Ho capito: "Vorrei una Margherita e una Coca Cola"
🤖 🔊 [Risposta vocale: "Perfetto! Ho aggiunto al tuo ordine: Margherita per 7 euro e Coca Cola per 3 euro"]
```

**Nota**: Se l'utente invia un messaggio vocale, riceve risposta vocale! 🎧

## ⚙️ Configurazione Tecnica

### API Utilizzate

1. **Telegram Bot API**
   - `getFileLink(fileId)` - Ottiene URL download file
   - Download file `.ogg` (formato vocale Telegram)
   - `sendVoice(chatId, audio)` - Invia messaggio vocale

2. **OpenAI Whisper API (Speech-to-Text)**
   - Model: `whisper-1`
   - Language: `it` (italiano)
   - Input: Stream audio `.ogg`
   - Output: Testo trascritto

3. **OpenAI TTS API (Text-to-Speech)**
   - Model: `tts-1`
   - Voice: `alloy` (voce naturale)
   - Speed: `1.0` (velocità normale)
   - Input: Testo della risposta
   - Output: Audio `.mp3`

### Directory e File

```
data/
└── telegram-audio/
    ├── voice_1234567890.ogg     (input utente - temporaneo)
    ├── response_1234567891.mp3  (risposta bot - temporaneo)
    └── .gitkeep
```

**Nota**: I file audio sono temporanei e vengono eliminati automaticamente dopo l'uso.

## 📊 Log Dettagliati

### Messaggio vocale ricevuto e risposta vocale

```
🎤 Messaggio vocale ricevuto da @username (5s)
⬇️  Download audio in corso...
✅ Audio scaricato: voice_1234567890.ogg
🔤 Trascrizione in corso...
✅ Trascrizione completata: "Vorrei una Margherita..."
🤖 Chiamata a OpenAI (2 messaggi in sessione)...
✅ Risposta AI ricevuta: 1 articoli nell'ordine
🔊 Generazione audio TTS in corso...
✅ Audio generato: response_1234567891.mp3
🔊 Risposta vocale inviata a @username
```

### Fallback a testo (se TTS fallisce)

```
⚠️  Errore TTS, invio testo: Rate limit exceeded
📤 Risposta testuale inviata a @username (fallback)
```

## 🚀 Performance

| Operazione | Tempo Medio |
|------------|-------------|
| Download audio | ~500ms |
| Trascrizione Whisper | ~2-3s |
| Risposta AI | ~1-2s |
| Generazione TTS | ~2-3s |
| Upload risposta | ~500ms |
| **Totale** | **~7-10s** |

*Tempo totale dipende dalla durata dei messaggi vocali*

### Confronto Testo vs Vocale

| Metodo | Tempo Risposta |
|--------|----------------|
| Messaggio testo | ~2-3s |
| Messaggio vocale | ~7-10s |

**Nota**: La risposta vocale è più lenta ma offre un'esperienza hands-free completa!

## 💡 Vantaggi

✅ **Completamente Hands-free**: Ordina senza toccare il telefono
✅ **Conversazione Naturale**: Come parlare con un cameriere
✅ **Bidirezionale**: Parli e ascolti, senza leggere
✅ **Preciso**: Whisper + TTS di alta qualità
✅ **Trasparente**: Mostra cosa ha capito
✅ **Accessibile**: Ottimo per utenti con difficoltà visive

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

### Tariffe API (2024)

| API | Costo | Unità |
|-----|-------|-------|
| **Whisper** (STT) | $0.006 | per minuto audio input |
| **TTS** | $0.015 | per 1000 caratteri output |

### Esempi Costi per Conversazione

**Scenario: Messaggio 10s con risposta 50 caratteri**
- Whisper: ~$0.001
- TTS: ~$0.0008
- **Totale: ~$0.0018 per conversazione**

**Stima mensile:**
- 100 conversazioni vocali/mese: ~$0.18
- 1000 conversazioni vocali/mese: ~$1.80

**Confronto con solo testo:**
- Solo Whisper (no TTS): ~$1.00/1000 messaggi
- Con Whisper + TTS: ~$1.80/1000 conversazioni

*Nota: Costi molto contenuti anche con TTS!*

### Ottimizzazione Costi

Se vuoi ridurre i costi:
- Mantieni risposte concise (meno caratteri TTS)
- Usa `tts-1` invece di `tts-1-hd` (già implementato)
- Considera fallback a testo per messaggi lunghi

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
