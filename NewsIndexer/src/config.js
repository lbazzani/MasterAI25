import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveNewsPath() {
  if (process.env.NEWS_DATA_PATH) {
    return path.resolve(process.env.NEWS_DATA_PATH);
  }

  const localPath = path.resolve(__dirname, '..', 'data', 'news.json');
  if (fs.existsSync(localPath)) {
    return localPath;
  }



  return localPath; // percorso di default anche se il file non esiste (verrà validato altrove)
}

export const CONFIG = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndex: process.env.PINECONE_INDEX_NAME || 'news-articles',
  pineconeCloud: process.env.PINECONE_CLOUD || 'aws',
  pineconeRegion: process.env.PINECONE_REGION || 'us-east-1',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  port: Number(process.env.PORT || 3100),
  newsDataPath: resolveNewsPath()
};
