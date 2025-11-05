import { ensureIndex } from './pinecone.js';
import { embedTexts } from './embedder.js';

const NEWS_NAMESPACE = 'news';

export async function searchArticles({ text, topK = 5, filter }) {
  if (!text || typeof text !== 'string') {
    throw new Error('text obbligatorio per la ricerca');
  }

  const [vector] = await embedTexts([text]);
  if (!vector) {
    throw new Error('Impossibile ottenere embedding per la query');
  }

  const index = await ensureIndex();
  const namespace = index.namespace(NEWS_NAMESPACE);

  const response = await namespace.query({
    vector,
    topK,
    includeMetadata: true,
    filter
  });

  return response.matches || [];
}
