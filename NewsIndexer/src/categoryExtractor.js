import OpenAI from 'openai';
import { z } from 'zod';
import { CONFIG } from './config.js';

const client = new OpenAI({ apiKey: CONFIG.openaiApiKey });

const CategorySchema = z.object({
  primary_category: z.string().min(1).max(80),
  secondary_categories: z.array(z.string()).max(20).default([]),
  topic_keywords: z.array(z.string()).max(50).default([]),
  rationale: z.string().optional()
}).strict();

function buildPrompt(article) {
  const { title, description, article_body } = article;
  const body = [
    `Titolo: ${title || 'N/D'}`,
    `Descrizione: ${description || 'N/D'}`,
    'Contenuto:',
    article_body || 'N/D'
  ].join('\n');

  return [
    {
      role: 'system',
      content: 'Sei un classificatore editoriale. Rispondi SOLO con JSON valido.'
    },
    {
      role: 'user',
      content:
`Analizza l'articolo seguente e determina:
- primary_category: categoria macro (es. politica, economia, tecnologia, cultura, sport, salute, energia, mobilità, cronaca, esteri, finanza, impresa, lifestyle)
- secondary_categories: eventuali sottocategorie pertinenti
- topic_keywords: parole chiave salienti (max 15)

Fornisci categorie coerenti con il contenuto, evitando generalizzazioni eccessive.

${body}`
    }
  ];
}

export async function extractCategories(article) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: buildPrompt(article)
  });

  const raw = response.choices?.[0]?.message?.content ?? '{}';
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Errore parsing categorie: ${error.message}`);
  }

  const safe = CategorySchema.parse(parsed);
  const unique = (arr) => Array.from(new Set(arr));

  return {
    primary_category: safe.primary_category.trim().toLowerCase(),
    secondary_categories: unique(
      safe.secondary_categories.map((c) => c.trim().toLowerCase()).filter(Boolean)
    ),
    topic_keywords: unique(
      safe.topic_keywords.map((k) => k.trim().toLowerCase()).filter(Boolean)
    )
      .slice(0, 15)
  };
}
