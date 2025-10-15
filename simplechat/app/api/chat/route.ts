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
const MENU_DATA_FILE = path.join(DATA_DIR, 'menu-data.json');

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MenuItem {
  nome: string;
  descrizione: string;
  prezzo: number;
  categoria: string;
}

interface AIResponse {
  data: MenuItem[];
  message: string;
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

async function readMenuData(): Promise<MenuItem[]> {
  try {
    const data = await fs.readFile(MENU_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeMenuData(menuData: MenuItem[]): Promise<void> {
  await fs.writeFile(MENU_DATA_FILE, JSON.stringify(menuData, null, 2));
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

    // Leggi i messaggi esistenti, il prompt di sistema e i dati del menu
    const messages = await readMessages();
    const systemPrompt = await readSystemPrompt();
    const currentMenuData = await readMenuData();

    // Aggiungi il messaggio dell'utente
    const userMessage: Message = {
      role: 'user',
      content: message,
    };
    messages.push(userMessage);

    // Prepara il prompt con il contesto del menu esistente
    let enhancedSystemPrompt = systemPrompt;
    if (currentMenuData.length > 0) {
      enhancedSystemPrompt += `\n\nMENU CORRENTE:\n${JSON.stringify(currentMenuData, null, 2)}\n\nQuando rispondi, includi sempre tutti i piatti del menu corrente nell'array "data", anche se non modificati.`;
    }

    // Prepara i messaggi per OpenAI (con system prompt)
    const openAIMessages = [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...messages.slice(-5),
    ];

    // Chiama OpenAI con response_format json_object
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: openAIMessages,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content || '{}';

    // Parse della risposta JSON
    let parsedResponse: AIResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      parsedResponse = {
        data: currentMenuData,
        message: responseContent,
      };
    }

    // Salva i nuovi dati del menu
    if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      await writeMenuData(parsedResponse.data);
    }

    // Crea il messaggio dell'assistente con la risposta completa
    const assistantMessage: Message = {
      role: 'assistant',
      content: JSON.stringify(parsedResponse),
    };

    // Aggiungi la risposta dell'assistente
    messages.push(assistantMessage);

    // Salva i messaggi
    await writeMessages(messages);

    return NextResponse.json({
      message: parsedResponse.message,
      data: parsedResponse.data,
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

// GET - Ottieni tutti i messaggi e i dati del menu
export async function GET() {
  try {
    const messages = await readMessages();
    const menuData = await readMenuData();
    return NextResponse.json({ messages, menuData });
  } catch (error: any) {
    console.error('Error reading data:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

// DELETE - Cancella tutti i messaggi e i dati del menu
export async function DELETE() {
  try {
    await writeMessages([]);
    await writeMenuData([]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
