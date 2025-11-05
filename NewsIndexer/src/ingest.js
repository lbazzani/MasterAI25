import { pathToFileURL } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { ensureIndex } from './pinecone.js';
import { embedTexts } from './embedder.js';
import { chunkText } from './chunking.js';
import { buildArticleMetadata, enrichChunkMetadata } from './metadata.js';
import { extractCategories } from './categoryExtractor.js';
import { composeArticleText, loadNewsDataset } from './newsLoader.js';
import { saveCategoryData } from './categoryCache.js';
import { CONFIG } from './config.js';

const NEWS_NAMESPACE = 'news';

export async function ingestNews(datasetPath) {
  const index = await ensureIndex();
  const namespace = index.namespace(NEWS_NAMESPACE);
  const articles = loadNewsDataset(datasetPath);

  console.log(`Trovati ${articles.length} articoli da processare.`);

  let totalChunks = 0;
  const categoryStats = new Map();
  const articleCategories = {};

  for (const article of articles) {
    const text = composeArticleText(article);
    if (!text) {
      console.warn(`Articolo senza testo ignorato (id=${article.id ?? 'n/a'})`);
      continue;
    }

    const chunks = chunkText(text, 2000, 200);
    if (chunks.length === 0) {
      console.warn(`Articolo senza chunk utile (id=${article.id ?? 'n/a'})`);
      continue;
    }

    const embeddings = await embedTexts(chunks);
    if (embeddings.length !== chunks.length) {
      console.warn(`Embedding mancante per articolo id=${article.id ?? 'n/a'}. Skip.`);
      continue;
    }

    const baseId = article.id ? `news-${article.id}` : uuidv4();
    let categories;
    try {
      categories = await extractCategories(article);
    } catch (error) {
      console.warn(`Impossibile estrarre categorie per articolo id=${article.id ?? 'n/a'}: ${error.message}`);
      categories = {
        primary_category: 'non classificato',
        secondary_categories: [],
        topic_keywords: []
      };
    }

    const primaryCategory = categories.primary_category || 'non classificato';
    const baseMetadata = buildArticleMetadata(article, categories);

    const vectors = embeddings.map((values, idx) => ({
      id: `${baseId}::${idx}`,
      values,
      metadata: enrichChunkMetadata(baseMetadata, chunks[idx], idx)
    }));

    await namespace.upsert(vectors);
    totalChunks += vectors.length;

    const cluster = categoryStats.get(primaryCategory) || {
      count: 0,
      secondary: new Map(),
      keywords: new Map(),
      samples: []
    };

    cluster.count += 1;
    for (const sec of categories.secondary_categories || []) {
      const current = cluster.secondary.get(sec) || 0;
      cluster.secondary.set(sec, current + 1);
    }
    for (const keyword of categories.topic_keywords || []) {
      const current = cluster.keywords.get(keyword) || 0;
      cluster.keywords.set(keyword, current + 1);
    }
    if (cluster.samples.length < 5) {
      cluster.samples.push({
        id: article.id ?? baseId,
        title: article.title || null,
        description: article.description || null
      });
    }
    categoryStats.set(primaryCategory, cluster);

    articleCategories[article.id ?? baseId] = {
      primary_category: primaryCategory,
      secondary_categories: categories.secondary_categories || [],
      topic_keywords: categories.topic_keywords || [],
      title: article.title || null
    };

    console.log(`Indicizzato articolo ${article.title || baseId} (${vectors.length} chunk).`);
  }

  const clusters = Array.from(categoryStats.entries()).map(([primary, data]) => ({
    primary_category: primary,
    count: data.count,
    secondary_categories: Array.from(data.secondary.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topic_keywords: Array.from(data.keywords.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    sample_articles: data.samples
  })).sort((a, b) => b.count - a.count);

  saveCategoryData({ clusters, perArticle: articleCategories });

  console.log(`Indicizzazione completata. Chunk totali: ${totalChunks}`);
}

const datasetPath = process.argv[2] || CONFIG.newsDataPath;
const calledDirectly = process.argv[1]
  ? pathToFileURL(process.argv[1]).href === import.meta.url
  : false;

if (calledDirectly) {
  ingestNews(datasetPath).catch((error) => {
    console.error("Errore durante l'ingest:", error);
    process.exit(1);
  });
}
