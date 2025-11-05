# News Pinecone Indexer

Applicazione minimale ispirata a MatchRicercaLavoro per indicizzare il dataset `news.json` su Pinecone, assegnare categorie semantiche alle notizie e interrogarle via API.

## Setup

1. Copia il file `.env.example` in `.env` e imposta le variabili:
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME` (es. `news-articles`)
   - opzionale `NEWS_DATA_PATH` se vuoi usare un dataset diverso da `../MatchRicercaLavoro/data/news.json`.
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Popola l'indice (calcola anche le categorie e salva i cluster in `data/category-clusters.json`):
   ```bash
   npm run ingest
   # oppure specifica un percorso personalizzato
   npm run ingest -- ./percorso/personalizzato/news.json
   ```

## API

Avviare il server:
```bash
npm start
```

Apri `http://localhost:3100` per usare la mini dashboard con:
- Select per categoria primaria/secondaria con elenco articoli filtrati.
- Chat per incollare un articolo e trovare notizie simili via Pinecone.

Endpoint disponibili (porta di default `3100`):
- `GET /healthz` → stato dell'applicazione.
- `GET /dataset` → informazioni sul dataset e prime 20 notizie.
- `GET /categories` → gerarchia categorie → secondarie.
- `GET /articles?primary=...&secondary=...` → articoli filtrati.
- `GET /clusters` → elenco dei cluster di categoria con frequenze, keyword e articoli di esempio.
- `GET /clusters/:primary` → dettagli del cluster richiesto (max 100 articoli).
- `POST /ingest` → rilancia l'indicizzazione (body opzionale `{ "dataPath": "/path/news.json" }`).
- `POST /search` → ricerca semantica tra le notizie. Accetta un filtro esplicito oppure il campo rapido `category`/`categories`:
  ```json
  { "text": "trend sul settore ferroviario", "categories": ["mobilità", "economia"] }
  ```
