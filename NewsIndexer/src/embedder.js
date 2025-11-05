import OpenAI from 'openai';
import { CONFIG } from './config.js';

const client = new OpenAI({ apiKey: CONFIG.openaiApiKey });

export async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const response = await client.embeddings.create({
    model: CONFIG.embeddingModel,
    input: texts
  });

  return response.data.map((item) => item.embedding);
}
