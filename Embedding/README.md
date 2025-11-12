# Applicazione Embedding OpenAI

Applicazione Python lato terminale per generare e salvare embeddings usando OpenAI.

## Installazione

1. Installa le dipendenze:
```bash
pip install -r requirements.txt
```

2. Configura l'API key di OpenAI:
   - Copia il file `.env.example` come `.env`
   - Aggiungi la tua API key: `OPENAI_API_KEY=sk-tua-api-key-qui`
   
   Oppure esporta la variabile d'ambiente:
   ```bash
   export OPENAI_API_KEY=sk-tua-api-key-qui
   ```

## Utilizzo

Esegui l'applicazione:
```bash
python app.py
```

L'applicazione:
- Legge le notizie da `notizie.json`
- Genera gli embeddings usando il modello `text-embedding-3-small`
- Salva gli embeddings in `embeddings/embeddings.json`
- Salta automaticamente le notizie già processate

## Struttura Progetto

```
Embedding/
├── app.py              # Script principale
├── notizie.json        # File con le notizie
├── requirements.txt    # Dipendenze Python
├── .env.example        # Template per configurazione API key
├── .env                # File di configurazione (da creare)
└── embeddings/         # Cartella per salvare gli embeddings
    └── embeddings.json # File con gli embeddings generati
```

## Formato Embeddings

Gli embeddings vengono salvati in formato JSON con la seguente struttura:
```json
[
  {
    "id": 154007717,
    "title": "Titolo notizia",
    "text": "Titolo\nDescrizione",
    "embedding": [0.123, -0.456, ...],
    "model": "text-embedding-3-small"
  }
]
```

