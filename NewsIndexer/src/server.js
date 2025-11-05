import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from './config.js';
import { ingestNews } from './ingest.js';
import { loadNewsDatasetCached, buildArticleLookup } from './newsLoader.js';
import { searchArticles } from './search.js';
import { readClusters, readArticleCategories } from './categoryCache.js';
import { generateAnswerFromContext } from './chatGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.get('/dataset', (_req, res) => {
  try {
    const articles = loadNewsDatasetCached();
    const preview = articles.slice(0, 20).map((article) => ({
      id: article.id ?? null,
      title: article.title ?? null,
      description: article.description ?? null,
      domain: article.domain ?? null,
      postdate: article.postdate ?? article.foo ?? null
    }));

    res.json({
      ok: true,
      total: articles.length,
      sample: preview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/clusters', (_req, res) => {
  try {
    const clusters = readClusters();
    if (!clusters.length) {
      return res.status(404).json({ error: 'Cluster non disponibili. Esegui prima l\'ingest delle notizie.' });
    }
    res.json({ ok: true, clusters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/categories', (_req, res) => {
  try {
    const clusters = readClusters();
    if (!clusters.length) {
      return res.status(404).json({ error: 'Categorie non disponibili. Esegui prima l\'ingest.' });
    }

    const categories = clusters.map((cluster) => ({
      primary: cluster.primary_category,
      count: cluster.count,
      secondary: (cluster.secondary_categories || []).map((sec) => ({
        name: sec.name,
        count: sec.count
      }))
    }));

    res.json({ ok: true, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/articles', (req, res) => {
  try {
    const primary = (req.query.primary || '').toLowerCase();
    const secondary = (req.query.secondary || '').toLowerCase();

    if (!primary) {
      return res.status(400).json({ error: 'Parametro "primary" obbligatorio' });
    }

    const categories = readArticleCategories();
    const { map: articleMap } = buildArticleLookup();

    const articles = Object.entries(categories)
      .filter(([, info]) => info.primary_category === primary)
      .filter(([, info]) => !secondary || (info.secondary_categories || []).includes(secondary))
      .map(([id, info]) => {
        const article = articleMap.get(id) || articleMap.get(`news-${id}`) || null;
        const details = article || {};
        return {
          id,
          title: details.title || info.title || null,
          description: details.description || null,
          domain: details.domain || null,
          postdate: details.postdate || details.foo || null,
          site_link: details.site_link || null,
          categories: [
            info.primary_category,
            ...(info.secondary_categories || [])
          ].filter(Boolean),
          topic_keywords: info.topic_keywords || []
        };
      });

    res.json({ ok: true, total: articles.length, articles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/clusters/:primary', (req, res) => {
  try {
    const target = (req.params.primary || '').toLowerCase();
    const clusters = readClusters();
    const cluster = clusters.find((c) => c.primary_category === target);
    if (!cluster) {
      return res.status(404).json({ error: `Cluster "${target}" non trovato.` });
    }

    const articles = readArticleCategories();
    const members = Object.entries(articles)
      .filter(([, info]) => info.primary_category === target)
      .map(([id, info]) => ({
        id,
        title: info.title ?? null,
        secondary_categories: info.secondary_categories ?? [],
        topic_keywords: info.topic_keywords ?? []
      }))
      .slice(0, 100);

    res.json({ ok: true, cluster, articles: members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ingest', async (req, res) => {
  try {
    const { dataPath } = req.body || {};
    await ingestNews(dataPath || CONFIG.newsDataPath);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/search', async (req, res) => {
  try {
    const { text, topK = 5, filter, category, categories } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'text obbligatorio' });
    }
    let effectiveFilter = filter;
    const categoryList = categories || category;
    if (!effectiveFilter && categoryList) {
      const arr = Array.isArray(categoryList) ? categoryList : [categoryList];
      const normalized = arr.map((c) => String(c || '').toLowerCase()).filter(Boolean);
      if (normalized.length) {
        effectiveFilter = { categories: { $in: normalized } };
      }
    }

    const matchesRaw = await searchArticles({ text, topK, filter: effectiveFilter });
    const matches = (matchesRaw || []).filter((m) => typeof m.score === 'number' ? m.score >= 0.4 : true);
    res.json({ ok: true, matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { prompt, topK = 8 } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'prompt obbligatorio' });
    }

    const matches = await searchArticles({ text: prompt, topK });
    const filtered = (matches || []).filter((m) => typeof m.score === 'number' ? m.score >= 0.3 : true);
    if (!filtered.length) {
      return res.status(404).json({ error: 'Nessuna notizia rilevante trovata.' });
    }

    const contextBlocks = filtered.map((m, idx) => {
      const meta = m.metadata || {};
      return [
        `Fonte #${idx + 1}`,
        `Titolo: ${meta.title || 'N/D'}`,
        meta.description ? `Descrizione: ${meta.description}` : null,
        meta.primary_category ? `Categoria: ${meta.primary_category}` : null,
        meta.postdate ? `Data: ${meta.postdate}` : null,
        `Testo: ${meta.chunk_text || '(chunk non disponibile)'}`,
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    const answer = await generateAnswerFromContext({ prompt, context: contextBlocks });

    res.json({
      ok: true,
      answer,
      sources: filtered.slice(0, 5).map((m) => ({
        id: m.id,
        score: m.score,
        metadata: {
          title: m.metadata?.title || null,
          site_link: m.metadata?.site_link || null,
          primary_category: m.metadata?.primary_category || null
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(CONFIG.port, () => {
  console.log(`News indexer in ascolto su http://localhost:${CONFIG.port}`);
});
