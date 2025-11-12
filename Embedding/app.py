#!/usr/bin/env python3
"""
Applicazione terminale per generare e salvare embeddings usando OpenAI.
Legge le notizie da notizie.json e salva gli embeddings in locale.
"""

import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

# Carica variabili d'ambiente da .env
load_dotenv()

# Configurazione
EMBEDDINGS_DIR = Path(__file__).parent / "embeddings"
EMBEDDINGS_FILE = EMBEDDINGS_DIR / "embeddings.json"
NOTIZIE_FILE = Path(__file__).parent / "notizie.json"
MODEL = "text-embedding-3-small"


def setup_directories():
    """Crea la cartella embeddings se non esiste."""
    EMBEDDINGS_DIR.mkdir(exist_ok=True)
    print(f"✓ Cartella embeddings pronta: {EMBEDDINGS_DIR}")


def get_openai_client() -> OpenAI:
    """Inizializza il client OpenAI con l'API key."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ Errore: OPENAI_API_KEY non trovata!")
        print("\nPer configurare l'API key:")
        print("1. Crea un file .env nella cartella del progetto")
        print("2. Aggiungi: OPENAI_API_KEY=sk-tua-api-key-qui")
        print("\nOppure esporta la variabile d'ambiente:")
        print("export OPENAI_API_KEY=sk-tua-api-key-qui")
        sys.exit(1)
    
    return OpenAI(api_key=api_key)


def load_notizie() -> List[Dict[str, Any]]:
    """Carica le notizie dal file JSON."""
    if not NOTIZIE_FILE.exists():
        print(f"❌ Errore: File {NOTIZIE_FILE} non trovato!")
        sys.exit(1)
    
    with open(NOTIZIE_FILE, 'r', encoding='utf-8') as f:
        notizie = json.load(f)
    
    print(f"✓ Caricate {len(notizie)} notizie da {NOTIZIE_FILE}")
    return notizie


def create_text_for_embedding(notizia: Dict[str, Any]) -> str:
    """Crea il testo da usare per l'embedding combinando title e description."""
    title = notizia.get("title", "")
    description = notizia.get("description", "")
    
    # Combina title e description
    text = f"{title}\n{description}".strip()
    
    return text


def generate_embedding(client: OpenAI, text: str) -> List[float]:
    """Genera l'embedding per un testo usando OpenAI."""
    try:
        response = client.embeddings.create(
            input=text,
            model=MODEL
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Errore durante la generazione dell'embedding: {e}")
        raise


def load_existing_embeddings() -> Dict[int, Dict[str, Any]]:
    """Carica gli embeddings esistenti se il file esiste."""
    if EMBEDDINGS_FILE.exists():
        with open(EMBEDDINGS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Converti in dict con id come chiave per accesso rapido
            return {item['id']: item for item in data}
    return {}


def save_embeddings(embeddings_data: List[Dict[str, Any]]):
    """Salva gli embeddings nel file JSON."""
    with open(EMBEDDINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(embeddings_data, f, ensure_ascii=False, indent=2)
    print(f"✓ Embeddings salvati in {EMBEDDINGS_FILE}")


def process_notizie(client: OpenAI, notizie: List[Dict[str, Any]], 
                    existing_embeddings: Dict[int, Dict[str, Any]],
                    skip_existing: bool = True):
    """Processa le notizie e genera gli embeddings."""
    embeddings_list = []
    processed = 0
    skipped = 0
    
    print(f"\n🔄 Inizio elaborazione di {len(notizie)} notizie...")
    print(f"Modello: {MODEL}\n")
    
    for idx, notizia in enumerate(notizie, 1):
        notizia_id = notizia.get("id")
        title = notizia.get("title", "N/A")
        
        # Salta se già processata
        if skip_existing and notizia_id in existing_embeddings:
            skipped += 1
            embeddings_list.append(existing_embeddings[notizia_id])
            if idx % 10 == 0:
                print(f"Progresso: {idx}/{len(notizie)} (saltate: {skipped})")
            continue
        
        # Crea il testo per l'embedding
        text = create_text_for_embedding(notizia)
        
        # Genera l'embedding
        try:
            embedding = generate_embedding(client, text)
            
            # Crea il record dell'embedding
            embedding_record = {
                "id": notizia_id,
                "title": title,
                "text": text,
                "embedding": embedding,
                "model": MODEL
            }
            
            embeddings_list.append(embedding_record)
            processed += 1
            
            # Mostra progresso ogni 10 notizie
            if idx % 10 == 0:
                print(f"Progresso: {idx}/{len(notizie)} (processate: {processed}, saltate: {skipped})")
        
        except Exception as e:
            print(f"❌ Errore processando notizia ID {notizia_id}: {e}")
            continue
    
    print(f"\n✓ Elaborazione completata!")
    print(f"  - Processate: {processed}")
    print(f"  - Saltate (già esistenti): {skipped}")
    print(f"  - Totale embeddings: {len(embeddings_list)}")
    
    return embeddings_list


def main():
    """Funzione principale."""
    print("=" * 60)
    print("🚀 Applicazione Embedding OpenAI")
    print("=" * 60)
    
    # Setup
    setup_directories()
    
    # Inizializza client OpenAI
    client = get_openai_client()
    print("✓ Client OpenAI inizializzato")
    
    # Carica notizie
    notizie = load_notizie()
    
    # Carica embeddings esistenti
    existing_embeddings = load_existing_embeddings()
    if existing_embeddings:
        print(f"✓ Trovati {len(existing_embeddings)} embeddings esistenti")
    
    # Processa notizie
    embeddings_list = process_notizie(client, notizie, existing_embeddings)
    
    # Salva embeddings
    if embeddings_list:
        save_embeddings(embeddings_list)
        print(f"\n✅ Operazione completata con successo!")
    else:
        print("\n⚠️  Nessun embedding da salvare.")


if __name__ == "__main__":
    main()

