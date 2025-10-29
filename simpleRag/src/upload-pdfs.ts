#!/usr/bin/env node

import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configurazione
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'pdf_documents';
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '1000');
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '200');
const PDF_DIR = path.join(process.cwd(), 'data', 'pdfs');

// Client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const qdrant = new QdrantClient({ url: QDRANT_URL });

interface Chunk {
  text: string;
  metadata: {
    filename: string;
    page?: number;
    chunkIndex: number;
  };
}

/**
 * Divide il testo in chunk con overlap
 */
function splitTextIntoChunks(text: string, filename: string, pageNum?: number): Chunk[] {
  const chunks: Chunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
    const chunkText = text.slice(startIndex, endIndex);

    chunks.push({
      text: chunkText,
      metadata: {
        filename,
        page: pageNum,
        chunkIndex,
      },
    });

    chunkIndex++;
    startIndex += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Estrae testo da PDF
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

/**
 * Genera embedding usando OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Crea la collection in Qdrant se non esiste
 */
async function ensureCollection() {
  try {
    await qdrant.getCollection(QDRANT_COLLECTION);
    console.log(`✅ Collection "${QDRANT_COLLECTION}" già esistente`);
  } catch (error) {
    console.log(`📦 Creazione collection "${QDRANT_COLLECTION}"...`);
    await qdrant.createCollection(QDRANT_COLLECTION, {
      vectors: {
        size: 1536, // text-embedding-3-small dimensione
        distance: 'Cosine',
      },
    });
    console.log(`✅ Collection creata con successo`);
  }
}

/**
 * Carica i chunk in Qdrant
 */
async function uploadChunksToQdrant(chunks: Chunk[]) {
  console.log(`\n📤 Caricamento ${chunks.length} chunks in Qdrant...`);

  const BATCH_SIZE = 10;
  let uploaded = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Genera embeddings per il batch
    const embeddings = await Promise.all(
      batch.map(chunk => generateEmbedding(chunk.text))
    );

    // Prepara i punti per Qdrant
    const points = batch.map((chunk, idx) => ({
      id: Date.now() + i + idx, // ID univoco
      vector: embeddings[idx],
      payload: {
        text: chunk.text,
        filename: chunk.metadata.filename,
        page: chunk.metadata.page,
        chunkIndex: chunk.metadata.chunkIndex,
      },
    }));

    // Upload batch
    await qdrant.upsert(QDRANT_COLLECTION, {
      wait: true,
      points,
    });

    uploaded += batch.length;
    console.log(`  ⏳ Caricati ${uploaded}/${chunks.length} chunks...`);
  }

  console.log(`✅ Tutti i chunks caricati con successo!\n`);
}

/**
 * Processa un singolo PDF
 */
async function processPDF(filePath: string): Promise<Chunk[]> {
  const filename = path.basename(filePath);
  console.log(`\n📄 Processando: ${filename}`);

  // Estrai testo
  console.log(`  🔍 Estrazione testo...`);
  const text = await extractTextFromPDF(filePath);
  console.log(`  ✅ Estratti ${text.length} caratteri`);

  // Dividi in chunks
  console.log(`  ✂️  Divisione in chunks...`);
  const chunks = splitTextIntoChunks(text, filename);
  console.log(`  ✅ Creati ${chunks.length} chunks`);

  return chunks;
}

/**
 * Main
 */
async function main() {
  console.log('🚀 SimpleRAG - Upload PDF a Qdrant\n');
  console.log('📋 Configurazione:');
  console.log(`  - Qdrant URL: ${QDRANT_URL}`);
  console.log(`  - Collection: ${QDRANT_COLLECTION}`);
  console.log(`  - Chunk Size: ${CHUNK_SIZE}`);
  console.log(`  - Chunk Overlap: ${CHUNK_OVERLAP}`);
  console.log(`  - PDF Directory: ${PDF_DIR}\n`);

  // Verifica configurazione
  if (!OPENAI_API_KEY) {
    console.error('❌ ERRORE: OPENAI_API_KEY non configurato');
    process.exit(1);
  }

  try {
    // Crea collection
    await ensureCollection();

    // Leggi tutti i PDF
    const files = await readdir(PDF_DIR);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      console.log(`⚠️  Nessun PDF trovato in ${PDF_DIR}`);
      console.log(`   Aggiungi file PDF nella directory e riprova.`);
      process.exit(0);
    }

    console.log(`\n📚 Trovati ${pdfFiles.length} PDF da processare`);

    // Processa tutti i PDF
    const allChunks: Chunk[] = [];

    for (const file of pdfFiles) {
      const filePath = path.join(PDF_DIR, file);
      try {
        const chunks = await processPDF(filePath);
        allChunks.push(...chunks);
      } catch (error) {
        const err = error as Error;
        console.error(`❌ Errore processando ${file}:`, err.message);
      }
    }

    // Upload a Qdrant
    if (allChunks.length > 0) {
      await uploadChunksToQdrant(allChunks);

      // Statistiche finali
      console.log('📊 Statistiche:');
      console.log(`  - PDF processati: ${pdfFiles.length}`);
      console.log(`  - Chunks totali: ${allChunks.length}`);
      console.log(`  - Dimensione media chunk: ${Math.round(allChunks.reduce((sum, c) => sum + c.text.length, 0) / allChunks.length)} caratteri`);

      console.log('\n✨ Upload completato con successo!');
    } else {
      console.log('\n⚠️  Nessun chunk da caricare');
    }

  } catch (error) {
    const err = error as Error;
    console.error('\n❌ Errore:', err.message);
    process.exit(1);
  }
}

main();
