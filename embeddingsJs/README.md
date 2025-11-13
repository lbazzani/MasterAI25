# 🧠 News Embeddings Generator

Scarica notizie da JSON e genera embeddings usando OpenAI per ogni notizia (titolo + descrizione).

## 🚀 Quick Start

### 1. Installa Dipendenze

```bash
cd embeddings
npm install
```

### 2. Configura Environment

```bash
cp .env.example .env
```

Modifica `.env`:

```env
OPENAI_API_KEY=sk-proj-...
NEWS_URL=https://cdn.bazzani.info/news/topnews.json?p=1762969100840
```

### 3. Genera Embeddings

```bash
npm run fetch
```

## 📁 Output

Gli embeddings vengono salvati in `data/`:

```
data/
├── embeddings-2024-11-12T10-30-00-000Z.json  # Timestamp specifico
├── embeddings-latest.json                     # Ultima versione
└── stats-latest.json                          # Statistiche
```

## 📄 Formato Output

```json
[
  {
    "id": 1,
    "title": "Titolo della notizia",
    "description": "Descrizione completa della notizia...",
    "embedding": [0.123, -0.456, ...],  // Array di 1536 numeri
    "originalData": {
      // Dati originali della notizia
    }
  }
]
```

## 🔧 Come Funziona

1. **Download**: Scarica il JSON delle notizie dall'URL configurato
2. **Parsing**: Estrae titolo e descrizione da ogni notizia
3. **Embedding**: Per ogni notizia, combina titolo + descrizione e genera embedding con OpenAI
4. **Salvataggio**: Salva tutti gli embeddings in file JSON

## 💡 Uso degli Embeddings

Puoi usare gli embeddings per:

- **Ricerca Semantica**: Trova notizie simili
- **Clustering**: Raggruppa notizie per argomento
- **Classificazione**: Categorizza automaticamente
- **Recommendation**: Suggerisci notizie correlate

### Esempio: Calcolo Similarità

```javascript
import { readFile } from 'fs/promises';

// Carica embeddings
const data = JSON.parse(await readFile('data/embeddings-latest.json'));

// Funzione cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Trova notizie simili alla prima
const referenceEmbedding = data[0].embedding;
const similarities = data.slice(1).map(news => ({
  title: news.title,
  similarity: cosineSimilarity(referenceEmbedding, news.embedding)
}));

// Ordina per similarità
similarities.sort((a, b) => b.similarity - a.similarity);
console.log('Notizie più simili:', similarities.slice(0, 5));
```

## 🔎 Trova Notizie Simili da CLI

Con gli embeddings generati puoi confrontare rapidamente una notizia e trovare le più vicine (similarità coseno) direttamente dal terminale:

```bash
npm run similar -- --id 154204439 --top 3
```

- `--id` (`-i`): ID della notizia da usare come riferimento (obbligatorio se non vuoi l'interfaccia interattiva)
- `--top` (`-k`): Quante notizie mostrare (default `3`, sovrascrivibile anche tramite env `DEFAULT_TOP_K`)

L'output riporta per ogni notizia:
- **vicinanza**: similarità coseno tra la notizia scelta e il candidato
- **distanza**: `1 - vicinanza`, utile se preferisci ragionare in termini di distanza invece che vicinanza

Se non passi l'ID, lo script ti chiederà di inserirlo da tastiera. L'output mostrerà titolo, descrizione (troncata) e punteggio di similarità per i migliori risultati.

### Cluster di notizie dense

Vuoi capire quali notizie hanno molte "vicine" entro una certa soglia di distanza? Usa il comando:

```bash
npm run dense -- --distance 0.4 --neighbors 3
```

- `--distance` (`-d`): distanza massima consentita (default `0.4`, equivalente a vicinanza ≥ `0.6`)
- `--neighbors` (`-n`): numero minimo di vicine richiesto per riportare la notizia (default `3`)
- `--out` (`-o`): percorso del JSON in cui salvare i cluster (default `data/clusters.json`, configurabile via `CLUSTERS_OUTPUT`)
- puoi impostare i default anche da `.env` con `MAX_DISTANCE`, `MIN_NEIGHBORS`, `CLUSTERS_OUTPUT`

Per ogni notizia che soddisfa i criteri vengono mostrati fino a 5 vicini più significativi con relativi valori di vicinanza e distanza. Le notizie già aggregate in un cluster non verranno ripetute in gruppi successivi, così da evidenziare cluster unici.

In parallelo il comando salva un JSON pronto per essere usato come prompt per LLM:

```json
[
  [
    "Titolo cluster 1\nDescrizione cluster 1",
    "Titolo vicino 1\nDescrizione vicino 1",
    "..."
  ],
  [
    "Titolo cluster 2\nDescrizione cluster 2",
    "..."
  ]
]
```

Ogni elemento dell'array principale rappresenta un cluster e contiene solo i testi (titolo + descrizione) di tutte le notizie del gruppo.

### Sommario dei cluster con ChatGPT

Per generare automaticamente un sommario di tutti i cluster usa:

```bash
npm run summarize -- --input clusters.json --out cluster-summary.txt --model gpt-4o-mini
```

- `--input` (`-i`): file JSON generato da `npm run dense` (default `data/clusters.json`, configurabile tramite `CLUSTERS_OUTPUT`)
- `--out` (`-o`): file di output del sommario (default `data/cluster-summary.txt`, override con `CLUSTER_SUMMARY_FILE`)
- `--model` (`-m`): modello OpenAI da usare (default `gpt-4o-mini`, override con `SUMMARY_MODEL`)
- `--lang` (`-l`): lingua del riassunto (default `italiano`, override con `SUMMARY_LANGUAGE`)

Lo script invia l'intero JSON al modello (usando `OPENAI_API_KEY`) e salva un sommario strutturato, pronto da condividere o pubblicare.

## 💰 Costi

**OpenAI Embeddings** (`text-embedding-3-small`):
- **Costo**: $0.02 per 1M tokens
- **~100 notizie**: ~$0.002
- **~1000 notizie**: ~$0.02

Molto economico! 💸

## 🔄 Aggiornamento Periodico

Per aggiornare gli embeddings regolarmente:

### Cron Job (Linux/Mac)

```bash
# Ogni giorno alle 6:00
0 6 * * * cd /path/to/embeddings && npm run fetch
```

### Manuale

```bash
npm run fetch
```

## 📊 Statistiche

Il file `stats-latest.json` contiene:

```json
{
  "timestamp": "2024-11-12T10:30:00.000Z",
  "totalNews": 150,
  "embeddingDimension": 1536,
  "averageTitleLength": 45.2,
  "averageDescriptionLength": 256.8
}
```

## 🐛 Troubleshooting

### Errore formato JSON

Se il JSON delle notizie ha una struttura diversa, lo script prova automaticamente questi campi:

**Array principale:**
- `newsData` (array diretto)
- `newsData.news`
- `newsData.data`
- `newsData.articles`

**Campi notizia:**
- Titolo: `title`, `titolo`, `headline`
- Descrizione: `description`, `descrizione`, `content`, `testo`

### Rate Limiting

Lo script include una pausa di 100ms tra chiamate per evitare rate limiting. Se necessario, aumenta in [src/fetch-and-embed.js:120](src/fetch-and-embed.js#L120):

```javascript
await new Promise(resolve => setTimeout(resolve, 200)); // 200ms
```

### Out of Memory

Se hai migliaia di notizie, processa in batch. Modifica lo script per salvare ogni N notizie.

## 🚀 Next Steps

Dopo aver generato gli embeddings, puoi:

1. **Caricarli in Qdrant** (vector database)
2. **Creare API di ricerca semantica**
3. **Fare clustering delle notizie**
4. **Sistema di raccomandazione**

### Esempio: Carica in Qdrant

```javascript
import { QdrantClient } from '@qdrant/js-client-rest';
import { readFile } from 'fs/promises';

const client = new QdrantClient({ url: 'http://localhost:6333' });

// Carica embeddings
const data = JSON.parse(await readFile('data/embeddings-latest.json'));

// Crea collection
await client.createCollection('news', {
  vectors: { size: 1536, distance: 'Cosine' }
});

// Upload
const points = data.map(news => ({
  id: news.id,
  vector: news.embedding,
  payload: {
    title: news.title,
    description: news.description
  }
}));

await client.upsert('news', { points });
```

## 📚 Risorse

- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Vector Similarity Search](https://www.pinecone.io/learn/vector-similarity/)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)

---

**Fatto con ❤️ per trovare notizie simili**
