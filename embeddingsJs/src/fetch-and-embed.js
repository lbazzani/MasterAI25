#!/usr/bin/env node

import OpenAI from 'openai/index.mjs';
import { writeFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Configurazione
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NEWS_URL = process.env.NEWS_URL || 'https://cdn.bazzani.info/news/topnews.json?p=1762969100840';
const DATA_DIR = path.join(process.cwd(), 'data');

// Client OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Scarica le notizie dal JSON
 */
async function fetchNews() {
  console.log(`\n📡 Scaricamento notizie da: ${NEWS_URL}`);

  try {
    const response = await fetch(NEWS_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Notizie scaricate con successo`);

    return data;
  } catch (error) {
    console.error('❌ Errore durante il download:', error.message);
    throw error;
  }
}

/**
 * Genera embedding per una notizia
 */
async function generateEmbedding(title, description) {
  // Combina titolo e descrizione
  const text = `${title}\n${description}`;

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error(`❌ Errore generazione embedding:`, error.message);
    throw error;
  }
}

/**
 * Processa tutte le notizie
 */
async function processNews(newsData) {
  console.log(`\n🔄 Processamento notizie...`);

  // Determina la struttura del JSON
  let newsList = [];

  // Gestisci diversi formati possibili
  if (Array.isArray(newsData)) {
    newsList = newsData;
  } else if (newsData.news && Array.isArray(newsData.news)) {
    newsList = newsData.news;
  } else if (newsData.data && Array.isArray(newsData.data)) {
    newsList = newsData.data;
  } else if (newsData.articles && Array.isArray(newsData.articles)) {
    newsList = newsData.articles;
  } else {
    console.error('❌ Formato JSON non riconosciuto');
    console.log('Struttura ricevuta:', Object.keys(newsData));
    throw new Error('Formato JSON non supportato');
  }

  console.log(`📰 Trovate ${newsList.length} notizie da processare\n`);

  const results = [];
  let processed = 0;

  for (const news of newsList) {
    // Estrai titolo e descrizione (gestisci diversi nomi di campo)
    const title = news.title || news.titolo || news.headline || 'Senza titolo';
    const description = news.description || news.descrizione || news.content || news.testo || '';

    if (!description) {
      console.log(`⚠️  Notizia senza descrizione: "${title}" - saltata`);
      continue;
    }

    try {
      console.log(`  [${processed + 1}/${newsList.length}] Processando: "${title.substring(0, 50)}..."`);

      // Genera embedding
      const embedding = await generateEmbedding(title, description);

      // Salva risultato
      results.push({
        id: news.id || processed,
        title,
        description,
        embedding,
        originalData: news, // Mantieni dati originali
      });

      processed++;

      // Rate limiting: piccola pausa tra chiamate
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Errore processando "${title}":`, error.message);
      // Continua con le altre notizie
    }
  }

  console.log(`\n✅ Processate ${processed}/${newsList.length} notizie con successo`);

  return results;
}

/**
 * Salva gli embeddings in file separati
 */
async function saveEmbeddings(results) {
  console.log(`\n💾 Salvataggio embeddings in file separati...`);

  try {
    let saved = 0;

    for (const result of results) {
      const filename = `${result.id}.json`;
      const filepath = path.join(DATA_DIR, filename);

      await writeFile(filepath, JSON.stringify(result, null, 2));
      saved++;

      if (saved % 10 === 0) {
        console.log(`  ⏳ Salvati ${saved}/${results.length} file...`);
      }
    }

    console.log(`✅ Tutti gli embeddings salvati: ${saved} file creati`);

    // Salva statistiche
    const stats = {
      timestamp: new Date().toISOString(),
      totalNews: results.length,
      embeddingDimension: results[0]?.embedding?.length || 0,
      averageTitleLength: results.reduce((sum, r) => sum + r.title.length, 0) / results.length,
      averageDescriptionLength: results.reduce((sum, r) => sum + r.description.length, 0) / results.length,
      files: results.map(r => `${r.id}.json`),
    };

    const statsPath = path.join(DATA_DIR, 'stats.json');
    await writeFile(statsPath, JSON.stringify(stats, null, 2));
    console.log(`📊 Statistiche salvate in: ${statsPath}`);

  } catch (error) {
    console.error('❌ Errore durante il salvataggio:', error.message);
    throw error;
  }
}

/**
 * Main
 */
async function main() {
  console.log('🚀 News Embeddings Generator\n');
  console.log('📋 Configurazione:');
  console.log(`  - OpenAI Model: text-embedding-3-small`);
  console.log(`  - Output Directory: ${DATA_DIR}`);
  console.log(`  - News URL: ${NEWS_URL}`);

  // Verifica configurazione
  if (!OPENAI_API_KEY) {
    console.error('\n❌ ERRORE: OPENAI_API_KEY non configurato nel file .env');
    process.exit(1);
  }

  try {
    // 1. Scarica notizie
    const newsData = await fetchNews();

    // 2. Genera embeddings
    const results = await processNews(newsData);

    if (results.length === 0) {
      console.log('\n⚠️  Nessuna notizia processata con successo');
      process.exit(0);
    }

    // 3. Salva risultati
    await saveEmbeddings(results);

    // Statistiche finali
    console.log('\n📈 Riepilogo:');
    console.log(`  - Notizie processate: ${results.length}`);
    console.log(`  - Dimensione embedding: ${results[0].embedding.length}`);
    console.log(`  - Costo stimato: ~$${(results.length * 0.00002).toFixed(4)}`);

    console.log('\n✨ Completato con successo!');

  } catch (error) {
    console.error('\n❌ Errore fatale:', error.message);
    process.exit(1);
  }
}

main();
