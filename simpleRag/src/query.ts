#!/usr/bin/env node

import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// Configurazione
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'pdf_documents';
const TOP_K = 5; // Numero di chunks da recuperare

// Client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const qdrant = new QdrantClient({ url: QDRANT_URL });

interface SearchResult {
  text: string;
  filename: string;
  page?: number;
  score: number;
}

/**
 * Genera embedding per la query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  return response.data[0].embedding;
}

/**
 * Cerca documenti simili in Qdrant
 */
async function searchSimilarDocuments(query: string): Promise<SearchResult[]> {
  console.log(`\n🔍 Cerco documenti rilevanti...`);

  // Genera embedding della query
  const queryEmbedding = await generateQueryEmbedding(query);

  // Cerca in Qdrant
  const searchResult = await qdrant.search(QDRANT_COLLECTION, {
    vector: queryEmbedding,
    limit: TOP_K,
    with_payload: true,
  });

  // Formatta risultati
  const results: SearchResult[] = searchResult.map(hit => ({
    text: (hit.payload?.text as string) || '',
    filename: (hit.payload?.filename as string) || 'unknown',
    page: hit.payload?.page as number | undefined,
    score: hit.score,
  }));

  console.log(`✅ Trovati ${results.length} documenti rilevanti\n`);

  return results;
}

/**
 * Genera risposta usando GPT-4 con contesto
 */
async function generateAnswer(query: string, context: SearchResult[]): Promise<string> {
  console.log(`🤖 Generazione risposta con GPT-4...\n`);

  // Costruisci il contesto dai documenti trovati
  const contextText = context
    .map((doc, idx) => {
      const pageInfo = doc.page ? ` (pagina ${doc.page})` : '';
      return `[${idx + 1}] Da "${doc.filename}"${pageInfo} (rilevanza: ${(doc.score * 100).toFixed(1)}%):\n${doc.text}`;
    })
    .join('\n\n---\n\n');

  // Chiamata a GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: `Sei un assistente esperto che risponde a domande basandosi esclusivamente sui documenti forniti.

ISTRUZIONI:
- Rispondi SOLO usando le informazioni nei documenti forniti
- Se la risposta non è nei documenti, dillo chiaramente
- Cita sempre la fonte (nome file e pagina se disponibile)
- Sii preciso e conciso
- Se ci sono più documenti rilevanti, sintetizza le informazioni
- Rispondi in italiano`,
      },
      {
        role: 'user',
        content: `Documenti disponibili:\n\n${contextText}\n\n---\n\nDomanda: ${query}`,
      },
    ],
  });

  return completion.choices[0].message.content || 'Nessuna risposta generata.';
}

/**
 * Mostra i risultati della ricerca
 */
function displaySearchResults(results: SearchResult[]) {
  console.log('📚 Documenti trovati:');
  results.forEach((doc, idx) => {
    const pageInfo = doc.page ? ` (pag. ${doc.page})` : '';
    console.log(`\n${idx + 1}. ${doc.filename}${pageInfo} - Rilevanza: ${(doc.score * 100).toFixed(1)}%`);
    console.log(`   ${doc.text.substring(0, 150)}...`);
  });
  console.log('');
}

/**
 * Esegue una query completa
 */
async function executeQuery(query: string) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`❓ Domanda: ${query}`);
    console.log('='.repeat(80));

    // Cerca documenti simili
    const searchResults = await searchSimilarDocuments(query);

    if (searchResults.length === 0) {
      console.log('⚠️  Nessun documento trovato per questa query.');
      return;
    }

    // Mostra risultati ricerca
    displaySearchResults(searchResults);

    // Genera risposta
    const answer = await generateAnswer(query, searchResults);

    // Mostra risposta
    console.log('💡 Risposta:');
    console.log('─'.repeat(80));
    console.log(answer);
    console.log('─'.repeat(80));

  } catch (error) {
    const err = error as Error;
    console.error('\n❌ Errore durante la query:', err.message);
  }
}

/**
 * Modalità interattiva
 */
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n💬 Modalità interattiva - Digita le tue domande (o "exit" per uscire)\n');

  const askQuestion = () => {
    rl.question('🔍 Domanda: ', async (query) => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.toLowerCase() === 'exit' || trimmedQuery.toLowerCase() === 'quit') {
        console.log('\n👋 Arrivederci!\n');
        rl.close();
        process.exit(0);
      }

      if (trimmedQuery.length === 0) {
        askQuestion();
        return;
      }

      await executeQuery(trimmedQuery);
      askQuestion();
    });
  };

  askQuestion();
}

/**
 * Main
 */
async function main() {
  console.log('🚀 SimpleRAG - Query System\n');
  console.log('📋 Configurazione:');
  console.log(`  - Qdrant URL: ${QDRANT_URL}`);
  console.log(`  - Collection: ${QDRANT_COLLECTION}`);
  console.log(`  - Top-K risultati: ${TOP_K}`);

  // Verifica configurazione
  if (!OPENAI_API_KEY) {
    console.error('\n❌ ERRORE: OPENAI_API_KEY non configurato');
    process.exit(1);
  }

  try {
    // Verifica che la collection esista
    await qdrant.getCollection(QDRANT_COLLECTION);
    console.log(`✅ Collection "${QDRANT_COLLECTION}" trovata`);

    // Controlla se ci sono argomenti da command line
    const args = process.argv.slice(2);

    if (args.length > 0) {
      // Modalità singola query
      const query = args.join(' ');
      await executeQuery(query);
    } else {
      // Modalità interattiva
      await interactiveMode();
    }

  } catch (error) {
    const err = error as Error;
    console.error('\n❌ Errore:', err.message);
    if (err.message.includes('Not found')) {
      console.error(`\n💡 La collection "${QDRANT_COLLECTION}" non esiste ancora.`);
      console.error('   Esegui prima "npm run upload" per caricare i PDF.\n');
    }
    process.exit(1);
  }
}

main();
