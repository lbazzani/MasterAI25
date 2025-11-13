#!/usr/bin/env node

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import process from 'process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_TOP_K = Number(process.env.DEFAULT_TOP_K || 3);

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    top: DEFAULT_TOP_K,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '-i' || arg === '--id') {
      parsed.id = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--id=')) {
      [, parsed.id] = arg.split('=');
    } else if (arg === '-k' || arg === '--top') {
      parsed.top = Number(args[i + 1]);
      i += 1;
    } else if (arg.startsWith('--top=')) {
      parsed.top = Number(arg.split('=')[1]);
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`\n🧭 Uso:
  node src/find-similar.js --id <NEWS_ID> [--top 3]

  Opzioni:
    -i, --id     ID della notizia da usare come riferimento
    -k, --top    Numero di risultati simili da mostrare (default: ${DEFAULT_TOP_K})
    -h, --help   Mostra questo messaggio
  `);
}

async function promptForId() {
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question('Inserisci ID della notizia da confrontare: ')).trim();
  rl.close();
  return answer;
}

async function loadEmbeddings() {
  const files = await readdir(DATA_DIR);
  const newsFiles = files.filter((file) => file.endsWith('.json') && file !== 'stats.json');

  if (newsFiles.length === 0) {
    throw new Error(`Nessun file embedding trovato in ${DATA_DIR}`);
  }

  const items = [];

  for (const file of newsFiles) {
    const fullPath = path.join(DATA_DIR, file);

    try {
      const raw = await readFile(fullPath, 'utf-8');
      const parsed = JSON.parse(raw);

      if (!parsed?.embedding?.length) {
        console.warn(`⚠️  File senza embedding valido: ${file}`);
        continue;
      }

      items.push(parsed);
    } catch (error) {
      console.warn(`⚠️  Impossibile leggere ${file}: ${error.message}`);
    }
  }

  if (items.length === 0) {
    throw new Error('Nessuna notizia valida caricata.');
  }

  return items;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i += 1) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB) || Number.EPSILON;
  return dot / denominator;
}

function formatNews(news) {
  return `[${news.id}] ${news.title}`;
}

function ensureTopValue(value) {
  if (Number.isNaN(value) || value <= 0) {
    return DEFAULT_TOP_K;
  }
  return value;
}

function formatScore(value) {
  return value.toFixed(4);
}

function toDistance(similarity) {
  return 1 - similarity;
}

async function main() {
  try {
    const { id: cliId, top: cliTop } = parseArgs();
    const allNews = await loadEmbeddings();
    const id = cliId || (await promptForId());
    const reference = allNews.find((item) => String(item.id) === String(id));

    if (!reference) {
      console.error(`❌ ID ${id} non trovato. Usa uno degli ID disponibili e riprova.`);
      process.exit(1);
    }

    const top = ensureTopValue(cliTop);
    console.log(`\n📌 Notizia selezionata: ${formatNews(reference)}\n`);

    const ranked = allNews
      .filter((item) => item.id !== reference.id)
      .map((item) => ({
        ...item,
        similarity: cosineSimilarity(reference.embedding, item.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, top);

    console.log(`🔍 Top ${top} notizie più simili (coseno):\n`);

    ranked.forEach((news, index) => {
      const similarity = news.similarity;
      const distance = toDistance(similarity);
      console.log(
        `${index + 1}. ${formatNews(news)} — vicinanza: ${formatScore(similarity)} | distanza: ${formatScore(distance)}`
      );
      if (news.description) {
        console.log(`   ${news.description.substring(0, 140)}${news.description.length > 140 ? '…' : ''}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error(`\n❌ Errore: ${error.message}`);
    process.exit(1);
  }
}

main();
