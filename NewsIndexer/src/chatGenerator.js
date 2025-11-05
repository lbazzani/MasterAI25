import OpenAI from 'openai';
import { CONFIG } from './config.js';

const client = new OpenAI({ apiKey: CONFIG.openaiApiKey });

export async function generateAnswerFromContext({ prompt, context }) {
  const messages = [
    {
      role: 'system',
      content: 'Sei un assistente che risponde usando esclusivamente il contesto fornito, in lingua italiana. Se le informazioni non sono presenti, ammetti la mancanza.'
    },
    {
      role: 'user',
      content:
`Domanda:
${prompt}

Contesto:
${context}

Istruzioni:
- Rispondi in italiano con un breve riassunto strutturato.
- Riporta i fatti principali citando le fonti con "Fonte #n".
- Se la risposta non è nel contesto, dichiara che non puoi rispondere.`
    }
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages
  });

  const answer = response.choices?.[0]?.message?.content ?? '';
  return answer.trim();
}
