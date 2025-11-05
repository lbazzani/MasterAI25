function safeString(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function parseDateToIso(input) {
  const raw = safeString(input);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw; // conserva il formato originale se non parsabile
  return parsed.toISOString();
}

function normArray(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const str = safeString(value);
    if (!str) continue;
    const lower = str.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    result.push(lower);
  }
  return result;
}

export function buildArticleMetadata(article = {}, categories = {}) {
  const title = safeString(article.title);
  const description = safeString(article.description);
  const domain = safeString(article.domain);
  const siteLink = safeString(article.site_link);
  const localImage = safeString(article.local_image);
  const sourceDate = parseDateToIso(article.postdate || article.foo);
  const primaryCategory = safeString(categories.primary_category)?.toLowerCase() || null;
  const secondaryCategories = normArray(categories.secondary_categories);
  const topicKeywords = normArray(categories.topic_keywords);
  const allCategories = primaryCategory
    ? [primaryCategory, ...secondaryCategories.filter((c) => c !== primaryCategory)]
    : secondaryCategories;

  return {
    article_id: article.id ?? null,
    source_id: article.id ?? null,
    title,
    description,
    domain,
    site_link: siteLink,
    local_image: localImage,
    postdate: sourceDate,
    primary_category: primaryCategory,
    categories: allCategories,
    topic_keywords: topicKeywords
  };
}

export function enrichChunkMetadata(baseMeta, chunkText, chunkId) {
  return {
    ...baseMeta,
    chunk_id: chunkId,
    chunk_text: chunkText
  };
}
