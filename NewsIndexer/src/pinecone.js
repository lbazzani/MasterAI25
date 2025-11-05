import { Pinecone } from '@pinecone-database/pinecone';
import { CONFIG } from './config.js';

export const pc = new Pinecone({
  apiKey: CONFIG.pineconeApiKey
});

async function indexExists(name) {
  const indexes = await pc.listIndexes();

  if (Array.isArray(indexes)) {
    return indexes.includes(name);
  }

  if (Array.isArray(indexes?.indexes)) {
    return indexes.indexes.some((item) => typeof item === 'string' ? item === name : item?.name === name);
  }

  return false;
}

export async function ensureIndex() {
  const name = CONFIG.pineconeIndex;

  if (!(await indexExists(name))) {
    await pc.createIndex({
      name,
      dimension: 1536,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: CONFIG.pineconeCloud,
          region: CONFIG.pineconeRegion
        }
      },
      tags: { app: 'news-indexer', dataset: 'news' },
      waitUntilReady: true,
      suppressConflicts: true
    });
  }

  return pc.index(name);
}
