import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'data');
const clustersPath = path.join(dataDir, 'category-clusters.json');
const articlePath = path.join(dataDir, 'article-categories.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function saveCategoryData({ clusters = [], perArticle = {} }) {
  ensureDataDir();
  fs.writeFileSync(clustersPath, JSON.stringify(clusters, null, 2), 'utf-8');
  fs.writeFileSync(articlePath, JSON.stringify(perArticle, null, 2), 'utf-8');
}

export function readClusters() {
  try {
    if (!fs.existsSync(clustersPath)) return [];
    const raw = fs.readFileSync(clustersPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function readArticleCategories() {
  try {
    if (!fs.existsSync(articlePath)) return {};
    const raw = fs.readFileSync(articlePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
