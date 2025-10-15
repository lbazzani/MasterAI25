import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SYSTEM_PROMPT_FILE = path.join(DATA_DIR, 'system-prompt.txt');

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function readMessages(): Promise<Message[]> {
  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeMessages(messages: Message[]): Promise<void> {
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

async function readSystemPrompt(): Promise<string> {
  try {
    return await fs.readFile(SYSTEM_PROMPT_FILE, 'utf-8');
  } catch (error) {
    return 'Sei un assistente AI utile e cordiale.';
  }
}

// POST - Invia un nuovo messaggio
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Leggi i messaggi esistenti e il prompt di sistema
    const messages = await readMessages();
    const systemPrompt = await readSystemPrompt();

    // Aggiungi il messaggio dell'utente
    const userMessage: Message = {
      role: 'user',
      content: message,
    };
    messages.push(userMessage);

    // Prepara i messaggi per OpenAI (con system prompt)
    const openAIMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

    // Chiama OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openAIMessages,
    });

    const assistantMessage: Message = {
      role: 'assistant',
      content: completion.choices[0].message.content || '',
    };

    // Aggiungi la risposta dell'assistente
    messages.push(assistantMessage);

    // Salva i messaggi
    await writeMessages(messages);

    return NextResponse.json({
      message: assistantMessage,
      allMessages: messages,
    });
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get response from ChatGPT' },
      { status: 500 }
    );
  }
}

// GET - Ottieni tutti i messaggi
export async function GET() {
  try {
    const messages = await readMessages();
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error reading messages:', error);
    return NextResponse.json(
      { error: 'Failed to read messages' },
      { status: 500 }
    );
  }
}

// DELETE - Cancella tutti i messaggi
export async function DELETE() {
  try {
    await writeMessages([]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting messages:', error);
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    );
  }
}
