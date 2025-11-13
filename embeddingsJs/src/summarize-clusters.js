#!/usr/bin/env node

import OpenAI from 'openai/index.mjs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_MODEL = process.env.SUMMARY_MODEL || 'gpt-4o-mini';
const DEFAULT_INPUT = process.env.CLUSTERS_OUTPUT || 'clusters.json';
const DEFAULT_OUTPUT = process.env.CLUSTER_SUMMARY_FILE || 'cluster-summary.txt';
const DEFAULT_LANGUAGE = process.env.SUMMARY_LANGUAGE || 'italiano';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    input: undefined,
    output: undefined,
    model: DEFAULT_MODEL,
    language: DEFAULT_LANGUAGE,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '-i' || arg === '--input') {
      parsed.input = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--input=')) {
      parsed.input = arg.split('=')[1];
    } else if (arg === '-o' || arg === '--out') {
      parsed.output = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--out=')) {
      parsed.output = arg.split('=')[1];
    } else if (arg === '-m' || arg === '--model') {
      parsed.model = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--model=')) {
      parsed.model = arg.split('=')[1];
    } else if (arg === '-l' || arg === '--lang') {
      parsed.language = args[i + 1];
      i += 1;
    } else if (arg.startsWith('--lang=')) {
      parsed.language = arg.split('=')[1];
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`\n📝 Uso:
  node src/summarize-clusters.js [--input clusters.json] [--out cluster-summary.txt] [--model gpt-4o-mini]

  Opzioni:
    -i, --input   File JSON contenente i cluster (default: data/${DEFAULT_INPUT})
    -o, --out     File di output per il sommario (default: data/${DEFAULT_OUTPUT})
    -m, --model   Modello OpenAI da usare (default: ${DEFAULT_MODEL})
    -l, --lang    Lingua del sommario (default: ${DEFAULT_LANGUAGE})
    -h, --help    Mostra questo messaggio
  `);
}

function resolvePath(filename, defaultName) {
  const target = filename || defaultName;
  if (!target) {
    throw new Error('Percorso non valido');
  }
  return path.isAbsolute(target) ? target : path.join(DATA_DIR, target);
}

async function loadClusters(filepath) {
  const raw = await readFile(filepath, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Il file dei cluster deve essere un array di cluster');
  }

  parsed.forEach((cluster, idx) => {
    if (!Array.isArray(cluster)) {
      throw new Error(`Cluster #${idx + 1} non è un array`);
    }
  });

  return parsed;
}

function buildPrompt(clusters, language) {
  const clusterText = clusters
    .map((cluster, idx) => {
      const items = cluster
        .map((entry, innerIdx) => `  - Notizia ${innerIdx + 1}: ${String(entry).trim().replace(/\s+/g, ' ')}`)
        .join('\n');
      return `Cluster ${idx + 1}:\n${items}`;
    })
    .join('\n\n');

  return `Di seguito trovi dei cluster di notizie. Ogni cluster contiene testi (titolo + descrizione) già simili tra loro.
Genera un breve sommario per ciascun cluster, in ${language}, specificando:
1. Un titolo sintetico del cluster
2. Un riassunto di 2-3 frasi
3. Un punto elenco con i temi principali

Mantieni una struttura numerata. Ecco i cluster:

${clusterText}`;
}

async function createSummary({ clusters, model, language }) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY non configurato.');
  }

  const prompt = buildPrompt(clusters, language);
  const response = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: 'Sei un assistente editoriale che sintetizza gruppi di notizie in modo conciso e informativo.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const summary = response.choices[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error('Nessun testo ricevuto dal modello.');
  }

  return summary;
}

async function saveSummary(content, filepath) {
  await mkdir(path.dirname(filepath), { recursive: true });
  await writeFile(filepath, content);
}

async function main() {
  try {
    const { input: cliInput, output: cliOutput, model, language } = parseArgs();
    const inputPath = resolvePath(cliInput, DEFAULT_INPUT);
    const outputPath = resolvePath(cliOutput, DEFAULT_OUTPUT);

    console.log(`\n📥 Lettura cluster da: ${inputPath}`);
    const clusters = await loadClusters(inputPath);

    if (clusters.length === 0) {
      console.log('⚠️  Nessun cluster presente nel file.');
      process.exit(0);
    }

    console.log(`🧠 Invio ${clusters.length} cluster al modello ${model}...`);
    const summary = await createSummary({ clusters, model, language });

    await saveSummary(summary, outputPath);
    console.log(`\n💾 Sommario salvato in: ${outputPath}\n`);
    console.log(summary);
  } catch (error) {
    console.error(`\n❌ Errore: ${error.message}`);
    process.exit(1);
  }
}

main();
