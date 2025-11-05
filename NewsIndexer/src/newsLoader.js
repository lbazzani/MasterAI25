import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.js';

function assertDatasetPath(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File dataset non trovato: ${filePath}`);
  }
  return filePath;
}

let cachedData = null;
let cachedPath = null;

function loadRawDataset(customPath) {
  const datasetPath = assertDatasetPath(path.resolve(customPath || CONFIG.newsDataPath));
  if (cachedData && cachedPath === datasetPath) {
    return cachedData;
  }

  const raw = fs.readFileSync(datasetPath, 'utf-8');
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Impossibile fare il parse di ${datasetPath}: ${error.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Il dataset deve essere un array di articoli. File: ${datasetPath}`);
  }

  cachedData = parsed;
  cachedPath = datasetPath;
  return parsed;
}

export function loadNewsDataset(customPath) {
  // Carica senza cache (usato durante ingest per avere dati freschi)
  cachedData = null;
  cachedPath = null;
  return loadRawDataset(customPath);
}

export function loadNewsDatasetCached(customPath) {
  return loadRawDataset(customPath);
}

export function buildArticleLookup(customPath) {
  const data = loadRawDataset(customPath);
  const map = new Map();

  for (const article of data) {
    const baseId = article.id ?? null;
    if (baseId !== null && baseId !== undefined) {
      const key = String(baseId);
      if (!map.has(key)) {
        map.set(key, article);
      }
      const prefixed = `news-${key}`;
      if (!map.has(prefixed)) {
        map.set(prefixed, article);
      }
    }
  }

  return { data, map };
}

export function composeArticleText(article = {}) {
  const sections = [
    article.title,
    article.description,
    article.article_body,
    article.summary
  ]
    .map((section) => (section ?? '').toString().trim())
    .filter(Boolean);

  return sections.join('\n\n');
}
