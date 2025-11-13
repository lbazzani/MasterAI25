#!/usr/bin/env node

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_MAX_DISTANCE = Number(process.env.MAX_DISTANCE ?? 0.4);
const DEFAULT_MIN_NEIGHBORS = Number(process.env.MIN_NEIGHBORS ?? 3);
const DEFAULT_OUTPUT_FILE = process.env.CLUSTERS_OUTPUT || 'clusters.json';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    distance: DEFAULT_MAX_DISTANCE,
    neighbors: DEFAULT_MIN_NEIGHBORS,
    output: undefined,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '-d' || arg === '--distance') {
      parsed.distance = Number(args[i + 1]);
      i += 1;
    } else if (arg.startsWith('--distance=')) {
      parsed.distance = Number(arg.split('=')[1]);
    } else if (arg === '-n' || arg === '--neighbors') {
      parsed.neighbors = Number(args[i + 1]);
      i += 1;
    } else if (arg.startsWith('--neighbors=')) {
      parsed.neighbors = Number(arg.split('=')[1]);
    } else if (arg === '-o' || arg === '--out') {
      parsed.output = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--out=')) {
      parsed.output = arg.split('=')[1];
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`\n📌 Uso:
  node src/find-dense.js [--distance 0.4] [--neighbors 3] [--out clusters.json]

  Opzioni:
    -d, --distance   Distanza massima da considerare (default: ${DEFAULT_MAX_DISTANCE})
    -n, --neighbors  Numero minimo di vicini richiesto (default: ${DEFAULT_MIN_NEIGHBORS})
    -o, --out        Percorso del file JSON di output (default: data/${DEFAULT_OUTPUT_FILE})
    -h, --help       Mostra questo messaggio
  `);
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

function analyzeDenseNews(allNews, maxDistance, minNeighbors) {
  const qualifying = [];
  const assignedIds = new Set();

  for (let i = 0; i < allNews.length; i += 1) {
    const current = allNews[i];
    if (assignedIds.has(current.id)) continue;

    const neighbors = [];

    for (let j = 0; j < allNews.length; j += 1) {
      if (i === j) continue;
      const candidate = allNews[j];
      if (assignedIds.has(candidate.id)) continue;

      const similarity = cosineSimilarity(current.embedding, candidate.embedding);
      const distance = 1 - similarity;

      if (distance <= maxDistance) {
        neighbors.push({ ...candidate, similarity, distance });
      }
    }

    if (neighbors.length >= minNeighbors) {
      neighbors.sort((a, b) => a.distance - b.distance);
      qualifying.push({
        news: current,
        count: neighbors.length,
        neighbors,
      });

      assignedIds.add(current.id);
      neighbors.forEach((neighbor) => assignedIds.add(neighbor.id));
    }
  }

  qualifying.sort((a, b) => b.count - a.count);
  return qualifying;
}

function formatScore(value) {
  return value.toFixed(4);
}

function describeNews(news) {
  const snippet = news.description
    ? `${news.description.substring(0, 100)}${news.description.length > 100 ? '…' : ''}`
    : 'Descrizione non disponibile';
  return `[${news.id}] ${news.title} — ${snippet}`;
}

function formatNewsText(news) {
  const title = news.title || 'Senza titolo';
  const description = news.description || '';
  return description ? `${title}\n${description}` : title;
}

function resolveOutputPath(requested) {
  if (!requested) {
    return path.join(DATA_DIR, DEFAULT_OUTPUT_FILE);
  }

  return path.isAbsolute(requested) ? requested : path.join(DATA_DIR, requested);
}

async function saveClustersAsText(clusters, outputPath) {
  const payload = clusters.map(({ news, neighbors }) => {
    const entries = [news, ...neighbors];
    return entries.map(formatNewsText);
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2));
}

async function main() {
  try {
    const { distance: cliDistance, neighbors: cliNeighbors, output: cliOutput } = parseArgs();
    const maxDistance = Number.isFinite(cliDistance) && cliDistance > 0 ? cliDistance : DEFAULT_MAX_DISTANCE;
    const minNeighbors = Number.isFinite(cliNeighbors) && cliNeighbors > 0 ? cliNeighbors : DEFAULT_MIN_NEIGHBORS;
    const outputPath = resolveOutputPath(cliOutput);

    const allNews = await loadEmbeddings();
    console.log(
      `\n🔎 Ricerca notizie con almeno ${minNeighbors} vicini entro distanza ${maxDistance} (vicinanza ≥ ${formatScore(
        1 - maxDistance
      )})`
    );

    const qualifying = analyzeDenseNews(allNews, maxDistance, minNeighbors);

    if (qualifying.length === 0) {
      console.log('\n⚠️  Nessuna notizia soddisfa i criteri specificati.');
      process.exit(0);
    }

    await saveClustersAsText(qualifying, outputPath);
    console.log(`\n💾 Cluster salvati in: ${outputPath}`);

    qualifying.forEach((item, index) => {
      console.log(`\n${index + 1}. ${describeNews(item.news)} — vicini: ${item.count}`);
      item.neighbors.slice(0, 5).forEach((neighbor, idx) => {
        console.log(
          `   ${idx + 1}) [${neighbor.id}] ${neighbor.title} — vicinanza: ${formatScore(
            neighbor.similarity
          )} | distanza: ${formatScore(neighbor.distance)}`
        );
      });
      if (item.neighbors.length > 5) {
        console.log(`   … altri ${item.neighbors.length - 5} vicini entro soglia`);
      }
    });
  } catch (error) {
    console.error(`\n❌ Errore: ${error.message}`);
    process.exit(1);
  }
}

main();
