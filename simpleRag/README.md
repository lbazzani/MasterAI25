# 🤖 SimpleRAG

Sistema RAG (Retrieval-Augmented Generation) semplice per interrogare documenti PDF usando **Qdrant** e **OpenAI**.

## 🎯 Caratteristiche

- 📄 **Caricamento PDF**: Estrai testo da PDF e caricali in Qdrant
- 🔍 **Ricerca Semantica**: Trova documenti rilevanti usando embeddings
- 💬 **Interrogazione AI**: Risposte precise basate sui tuoi documenti
- 🎨 **Modalità Interattiva**: Chatta con i tuoi PDF
- 🐳 **Docker Ready**: Qdrant in container per setup rapido

## 📋 Prerequisiti

- Node.js 18+
- Docker e Docker Compose
- OpenAI API Key

## 🚀 Quick Start

### 1. Clona e Installa

```bash
cd simpleRag
npm install
```

### 2. Configura Environment

```bash
cp .env.example .env
```

Modifica `.env` con la tua API key OpenAI:

```env
OPENAI_API_KEY=sk-proj-...
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=pdf_documents
```

### 3. Avvia Qdrant

```bash
docker-compose up -d
```

Verifica che Qdrant sia attivo: http://localhost:6333/dashboard

### 4. Carica i PDF

Aggiungi i tuoi PDF in `data/pdfs/`:

```bash
cp mio-documento.pdf data/pdfs/
```

Poi caricali in Qdrant:

```bash
npm run upload
```

### 5. Interroga i Documenti

**Modalità interattiva:**

```bash
npm run query
```

**Query singola:**

```bash
npm run query "Qual è il tema principale del documento?"
```

## 📁 Struttura Progetto

```
simpleRag/
├── data/
│   └── pdfs/              # I tuoi file PDF
├── src/
│   ├── upload-pdfs.ts     # Script caricamento PDF
│   └── query.ts           # Script interrogazione
├── qdrant_storage/        # Dati Qdrant (creato automaticamente)
├── docker-compose.yml     # Configurazione Docker
├── .env                   # Configurazione (da creare)
└── package.json
```

## 🔧 Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm install` | Installa dipendenze |
| `npm run upload` | Carica PDF in Qdrant |
| `npm run query` | Modalità interattiva |
| `npm run query "domanda"` | Query singola |
| `docker-compose up -d` | Avvia Qdrant |
| `docker-compose down` | Ferma Qdrant |

## 💡 Come Funziona

### 1. Upload (Caricamento PDF)

```
PDF → Estrazione Testo → Chunking → Embeddings → Qdrant
```

1. **Estrazione**: Usa `pdf-parse` per estrarre testo
2. **Chunking**: Divide il testo in pezzi di 1000 caratteri con overlap di 200
3. **Embeddings**: Genera embeddings con `text-embedding-3-small`
4. **Storage**: Salva in Qdrant con metadata (filename, pagina, ecc.)

### 2. Query (Interrogazione)

```
Domanda → Embedding → Ricerca Qdrant → Top-K Risultati → GPT-4 → Risposta
```

1. **Embedding Query**: Genera embedding della domanda
2. **Ricerca**: Trova i 5 chunks più simili in Qdrant
3. **Contesto**: Costruisce contesto con i risultati
4. **Generazione**: GPT-4 genera risposta basata sul contesto
5. **Citazioni**: Risposta include riferimenti ai documenti fonte

## 📊 Esempio Sessione

```bash
$ npm run query

🚀 SimpleRAG - Query System

📋 Configurazione:
  - Qdrant URL: http://localhost:6333
  - Collection: pdf_documents
  - Top-K risultati: 5
✅ Collection "pdf_documents" trovata

💬 Modalità interattiva - Digita le tue domande (o "exit" per uscire)

🔍 Domanda: Quali sono i punti principali del documento?

================================================================================
❓ Domanda: Quali sono i punti principali del documento?
================================================================================

🔍 Cerco documenti rilevanti...
✅ Trovati 5 documenti rilevanti

📚 Documenti trovati:

1. report-2024.pdf (pag. 3) - Rilevanza: 89.2%
   Nel 2024 abbiamo raggiunto risultati straordinari...

2. report-2024.pdf (pag. 1) - Rilevanza: 85.7%
   Questo documento presenta un'analisi dettagliata...

🤖 Generazione risposta con GPT-4...

💡 Risposta:
────────────────────────────────────────────────────────────────────────────────
Secondo il documento "report-2024.pdf", i punti principali sono:

1. **Risultati 2024**: L'azienda ha raggiunto crescita del 35% (pag. 3)
2. **Nuovi prodotti**: Lancio di 3 prodotti innovativi (pag. 1)
3. **Espansione**: Apertura in 5 nuovi mercati internazionali (pag. 3)

Fonte: report-2024.pdf, pagine 1 e 3
────────────────────────────────────────────────────────────────────────────────

🔍 Domanda: exit

👋 Arrivederci!
```

## ⚙️ Configurazione Avanzata

### Parametri Chunking

Modifica in `.env`:

```env
CHUNK_SIZE=1000          # Dimensione chunk in caratteri
CHUNK_OVERLAP=200        # Overlap tra chunks
```

**Linee guida:**
- Chunk più piccoli (500-800): Migliore per citazioni precise
- Chunk più grandi (1500-2000): Migliore per contesto generale
- Overlap 15-20% della dimensione chunk

### Numero Risultati

Modifica `TOP_K` in [src/query.ts:15](src/query.ts#L15):

```typescript
const TOP_K = 5; // Aumenta per più contesto, riduci per focus
```

### Modello Embeddings

In [src/upload-pdfs.ts:65](src/upload-pdfs.ts#L65) e [src/query.ts:30](src/query.ts#L30):

```typescript
model: 'text-embedding-3-large', // Migliore qualità, più costoso
```

| Modello | Dimensioni | Prestazioni | Costo |
|---------|------------|-------------|-------|
| `text-embedding-3-small` | 1536 | Buone | $ |
| `text-embedding-3-large` | 3072 | Ottime | $$$ |

**Nota**: Se cambi modello, devi:
1. Ricreare la collection Qdrant
2. Aggiornare `size` in [src/upload-pdfs.ts:82](src/upload-pdfs.ts#L82)
3. Ricaricare tutti i PDF

## 💰 Costi OpenAI

### Embeddings

| Modello | Costo per 1M tokens |
|---------|---------------------|
| text-embedding-3-small | $0.02 |
| text-embedding-3-large | $0.13 |

**Esempio:** 10 PDF (100 pagine totali, ~50k tokens):
- Upload: ~$0.001 (small) o ~$0.007 (large)
- Query: ~$0.00001 per domanda

### GPT-4

| Modello | Input | Output |
|---------|-------|--------|
| gpt-4o-mini | $0.150/1M | $0.600/1M |
| gpt-4o | $2.50/1M | $10.00/1M |

**Esempio query tipica:**
- Contesto: ~2000 tokens
- Risposta: ~500 tokens
- Costo: ~$0.0006 (mini) o ~$0.010 (gpt-4o)

## 🐛 Troubleshooting

### Qdrant non raggiungibile

```
❌ Errore: connect ECONNREFUSED 127.0.0.1:6333
```

**Soluzione:**
```bash
docker-compose up -d
docker ps  # Verifica che sia in esecuzione
```

### Collection non trovata

```
❌ La collection "pdf_documents" non esiste ancora
```

**Soluzione:**
```bash
npm run upload  # Carica prima i PDF
```

### Nessun PDF trovato

```
⚠️  Nessun PDF trovato in data/pdfs
```

**Soluzione:**
```bash
cp tuoi-pdf.pdf data/pdfs/
npm run upload
```

### Errore parsing PDF

Alcuni PDF potrebbero essere immagini scannerizzate o protetti. Usa:
- PDF con testo selezionabile
- Rimuovi protezione password

### Out of Memory

Se hai molti PDF grandi:
- Riduci `CHUNK_SIZE`
- Processa PDF uno alla volta
- Aumenta memoria Node: `NODE_OPTIONS=--max-old-space-size=4096 npm run upload`

## 🔐 Privacy e Sicurezza

- ✅ **Dati locali**: Qdrant gira localmente, i PDF non lasciano il tuo computer
- ⚠️ **OpenAI**: Gli embeddings e le query vengono inviate a OpenAI
- 🔒 **Best practice**: Non caricare documenti confidenziali senza consenso

## 🚀 Miglioramenti Futuri

- [ ] Supporto altri formati (DOCX, TXT, Markdown)
- [ ] Cache embeddings per evitare duplicati
- [ ] UI web per caricamento e query
- [ ] Filtri per metadata (data, autore, categoria)
- [ ] Export risposte in formato report
- [ ] Supporto multi-lingua
- [ ] OCR per PDF scannerizzati

## 📚 Risorse

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [RAG Pattern](https://www.anthropic.com/index/retrieval-augmented-generation)

## 📄 Licenza

MIT

---

**Creato con ❤️ per semplificare l'accesso ai tuoi documenti**
