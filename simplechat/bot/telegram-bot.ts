import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';

// Carica variabili d'ambiente
dotenv.config();

// Configurazione
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Verifica token
if (!TELEGRAM_TOKEN) {
  console.error('❌ ERRORE: TELEGRAM_BOT_TOKEN non configurato nel file .env');
  console.error('📝 Aggiungi questa riga al file .env:');
  console.error('   TELEGRAM_BOT_TOKEN=il_tuo_token_qui');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ ERRORE: OPENAI_API_KEY non configurato nel file .env');
  process.exit(1);
}

const DATA_DIR = path.join(process.cwd(), 'data');
const TELEGRAM_SESSIONS_DIR = path.join(DATA_DIR, 'telegram-sessions');
const TELEGRAM_AUDIO_DIR = path.join(DATA_DIR, 'telegram-audio');
const SYSTEM_PROMPT_FILE = path.join(DATA_DIR, 'system-prompt.txt');
const MENU_PRODUCTS_FILE = path.join(DATA_DIR, 'menu.json');

// Inizializza OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Interfaces
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
  orderClosed?: boolean;
}

interface MenuProduct {
  nome: string;
  descrizione: string;
  prezzo: number;
  allergeni: string[];
}

interface MenuStructure {
  menu: {
    pizze: MenuProduct[];
    bevande: MenuProduct[];
  };
}

interface UserSession {
  messages: Message[];
  orders: MenuItem[];
}

// Storage per sessioni utente (cache in memoria)
const userSessions = new Map<number, UserSession>();

// Funzioni helper per lettura/scrittura file
async function readSystemPrompt(): Promise<string> {
  try {
    return await fs.readFile(SYSTEM_PROMPT_FILE, 'utf-8');
  } catch (error) {
    return 'Sei un assistente AI utile e cordiale.';
  }
}

async function readMenuProducts(): Promise<MenuStructure> {
  try {
    const data = await fs.readFile(MENU_PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { menu: { pizze: [], bevande: [] } };
  }
}

// Crea directory sessioni se non esiste
async function ensureSessionsDir(): Promise<void> {
  try {
    await fs.access(TELEGRAM_SESSIONS_DIR);
  } catch {
    await fs.mkdir(TELEGRAM_SESSIONS_DIR, { recursive: true });
    console.log(`📁 Creata directory: ${TELEGRAM_SESSIONS_DIR}`);
  }
}

// Crea directory audio se non esiste
async function ensureAudioDir(): Promise<void> {
  try {
    await fs.access(TELEGRAM_AUDIO_DIR);
  } catch {
    await fs.mkdir(TELEGRAM_AUDIO_DIR, { recursive: true });
    console.log(`📁 Creata directory audio: ${TELEGRAM_AUDIO_DIR}`);
  }
}

// Scarica file audio da Telegram
async function downloadVoiceFile(fileId: string): Promise<string> {
  const fileLink = await bot.getFileLink(fileId);
  const fileName = `voice_${Date.now()}.ogg`;
  const filePath = path.join(TELEGRAM_AUDIO_DIR, fileName);

  return new Promise((resolve, reject) => {
    const protocol = fileLink.startsWith('https:') ? https : http;
    protocol.get(fileLink, (response) => {
      const stream = response.pipe(fsSync.createWriteStream(filePath));
      stream.on('finish', () => {
        stream.close();
        resolve(filePath);
      });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

// Trascrivi audio con OpenAI Whisper
async function transcribeAudio(filePath: string): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: fsSync.createReadStream(filePath),
    model: 'whisper-1',
    language: 'it',
  });

  return transcription.text;
}

// Pulisci file audio temporaneo
async function cleanupAudioFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Errore nella pulizia file audio:', error);
  }
}

// Ottiene il path del file sessione per un utente
function getUserSessionFile(userId: number): string {
  return path.join(TELEGRAM_SESSIONS_DIR, `user_${userId}.json`);
}

// Carica la sessione di un utente (da file o crea nuova)
async function getUserSession(userId: number): Promise<UserSession> {
  // Se è già in cache, ritorna
  if (userSessions.has(userId)) {
    return userSessions.get(userId)!;
  }

  // Altrimenti prova a caricare da file
  const sessionFile = getUserSessionFile(userId);
  try {
    const data = await fs.readFile(sessionFile, 'utf-8');
    const session: UserSession = JSON.parse(data);
    userSessions.set(userId, session);
    console.log(`📂 Sessione caricata per user ${userId}: ${session.messages.length} messaggi, ${session.orders.length} articoli`);
    return session;
  } catch {
    // Se il file non esiste, crea una nuova sessione
    const newSession: UserSession = {
      messages: [],
      orders: [],
    };
    userSessions.set(userId, newSession);
    return newSession;
  }
}

// Salva la sessione di un utente su file
async function saveUserSession(userId: number, session: UserSession): Promise<void> {
  userSessions.set(userId, session);

  // Salva anche su file
  const sessionFile = getUserSessionFile(userId);
  await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
}

// Azzera la sessione di un utente
async function clearUserSession(userId: number): Promise<void> {
  const emptySession: UserSession = {
    messages: [],
    orders: [],
  };

  userSessions.set(userId, emptySession);

  // Salva anche su file
  const sessionFile = getUserSessionFile(userId);
  await fs.writeFile(sessionFile, JSON.stringify(emptySession, null, 2));
}

// Crea bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Inizializza directory sessioni e audio
(async () => {
  await ensureSessionsDir();
  await ensureAudioDir();
})();

console.log('🤖 Bot Telegram avviato con successo!');
console.log('📡 Token:', TELEGRAM_TOKEN.substring(0, 10) + '...');
console.log('💾 Sessioni salvate in:', TELEGRAM_SESSIONS_DIR);
console.log('🎯 Bot in ascolto dei messaggi...\n');

// Comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const username = msg.from?.username || msg.from?.first_name || 'Sconosciuto';

  console.log(`\n📥 /start ricevuto da @${username} (ID: ${userId})`);

  const welcomeMessage = `
🍕 *Benvenuto in SimpleChat - Menu Creator!*

Sono il tuo assistente per ordinazioni di pizze e bevande.

📋 *Comandi disponibili:*
/start - Mostra questo messaggio
/ordine - Visualizza il tuo ordine corrente
/reset - Azzera la conversazione e l'ordine
/help - Mostra l'elenco completo del menu

💬 *Come ordinare:*
Scrivimi semplicemente cosa desideri, ad esempio:
• "Vorrei una Margherita e una Coca Cola"
• "Quali pizze avete senza glutine?"
• "Aggiungi una Birra Bionda"
• "Rimuovi la Coca Cola"

Quando hai finito di ordinare, dimmi "conferma ordine" o "chiudi ordine"!
  `;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  console.log(`✅ Messaggio di benvenuto inviato a @${username}`);
});

// Comando /help - Mostra menu completo
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username || msg.from?.first_name || 'Sconosciuto';

  console.log(`\n📥 /help ricevuto da @${username}`);

  try {
    const menuProducts = await readMenuProducts();

    let menuText = '📋 *MENU COMPLETO*\n\n';

    // Pizze
    menuText += '🍕 *PIZZE*\n\n';
    menuProducts.menu.pizze.forEach((pizza) => {
      menuText += `*${pizza.nome}* - €${pizza.prezzo.toFixed(2)}\n`;
      menuText += `_${pizza.descrizione}_\n`;
      if (pizza.allergeni.length > 0) {
        menuText += `⚠️ Allergeni: ${pizza.allergeni.join(', ')}\n`;
      }
      menuText += '\n';
    });

    // Bevande
    menuText += '\n🥤 *BEVANDE*\n\n';
    menuProducts.menu.bevande.forEach((bevanda) => {
      menuText += `*${bevanda.nome}* - €${bevanda.prezzo.toFixed(2)}\n`;
      menuText += `_${bevanda.descrizione}_\n`;
      if (bevanda.allergeni.length > 0) {
        menuText += `⚠️ Allergeni: ${bevanda.allergeni.join(', ')}\n`;
      }
      menuText += '\n';
    });

    bot.sendMessage(chatId, menuText, { parse_mode: 'Markdown' });
    console.log(`✅ Menu completo inviato a @${username} (${menuProducts.menu.pizze.length} pizze, ${menuProducts.menu.bevande.length} bevande)`);
  } catch (error) {
    console.error('❌ Errore nel leggere il menu:', error);
    bot.sendMessage(chatId, '❌ Errore nel recuperare il menu.');
  }
});

// Comando /ordine - Mostra ordine corrente
bot.onText(/\/ordine/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const username = msg.from?.username || msg.from?.first_name || 'Sconosciuto';

  console.log(`\n📥 /ordine ricevuto da @${username} (ID: ${userId})`);

  if (!userId) return;

  const session = await getUserSession(userId);

  if (session.orders.length === 0) {
    console.log(`📋 Ordine vuoto per @${username}`);
    bot.sendMessage(chatId, '📋 Il tuo ordine è vuoto.\n\nScrivimi cosa desideri ordinare!');
    return;
  }

  let orderText = '📋 *IL TUO ORDINE*\n\n';

  let total = 0;
  session.orders.forEach((item, index) => {
    orderText += `${index + 1}. *${item.nome}* - €${item.prezzo.toFixed(2)}\n`;
    orderText += `   _${item.descrizione}_\n\n`;
    total += item.prezzo;
  });

  orderText += `\n💰 *TOTALE: €${total.toFixed(2)}*\n`;
  orderText += `📦 *Totale articoli: ${session.orders.length}*`;

  console.log(`✅ Ordine inviato a @${username}: ${session.orders.length} articoli, €${total.toFixed(2)}`);
  bot.sendMessage(chatId, orderText, { parse_mode: 'Markdown' });
});

// Comando /reset - Azzera tutto
bot.onText(/\/reset/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const username = msg.from?.username || msg.from?.first_name || 'Sconosciuto';

  console.log(`\n📥 /reset ricevuto da @${username} (ID: ${userId})`);

  if (!userId) return;

  await clearUserSession(userId);
  console.log(`🗑️ Sessione azzerata per @${username}`);
  bot.sendMessage(chatId, '🗑️ Conversazione e ordine azzerati!\n\nPuoi iniziare un nuovo ordine quando vuoi.');
});

// Gestione messaggi normali
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = msg.text;
  const username = msg.from?.username || msg.from?.first_name || 'Sconosciuto';

  if (!userId || !text) return;

  // Ignora i comandi (già gestiti sopra)
  if (text.startsWith('/')) return;

  console.log(`\n💬 Messaggio da @${username}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

  try {
    // Mostra typing...
    bot.sendChatAction(chatId, 'typing');

    // Recupera la sessione utente
    const session = await getUserSession(userId);

    // Leggi system prompt e menu
    const systemPrompt = await readSystemPrompt();
    const menuProducts = await readMenuProducts();

    // Crea messaggio utente
    const userMessage: Message = {
      role: 'user',
      content: text,
    };
    session.messages.push(userMessage);

    // Prepara il prompt con il menu e le ordinazioni correnti
    let enhancedSystemPrompt = systemPrompt;
    enhancedSystemPrompt += `\n\n${JSON.stringify(menuProducts, null, 2)}`;

    if (session.orders.length > 0) {
      enhancedSystemPrompt += `\n\nORDINAZIONI CORRENTI:\n${JSON.stringify(session.orders, null, 2)}\n\nQuando rispondi, includi sempre tutti i piatti ordinati nell'array "data", anche se non modificati.`;
    }

    // Chiama OpenAI
    const openAIMessages = [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...session.messages.slice(-5), // Ultimi 5 messaggi per contesto
    ];

    console.log(`🤖 Chiamata a OpenAI (${session.messages.length} messaggi in sessione)...`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAIMessages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content || '{}';
    const parsedResponse: AIResponse = JSON.parse(responseContent);

    console.log(`✅ Risposta AI ricevuta: ${parsedResponse.data?.length || 0} articoli nell'ordine`);

    // Salva risposta dell'assistente
    const assistantMessage: Message = {
      role: 'assistant',
      content: JSON.stringify(parsedResponse),
    };
    session.messages.push(assistantMessage);

    // Aggiorna gli ordini
    if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      session.orders = parsedResponse.data;
    }

    // Salva la sessione
    await saveUserSession(userId, session);

    // Invia risposta all'utente
    let responseText = parsedResponse.message;

    // Se l'ordine è chiuso, aggiungi il riepilogo
    if (parsedResponse.orderClosed && session.orders.length > 0) {
      const total = session.orders.reduce((sum, item) => sum + item.prezzo, 0);
      responseText += `\n\n✅ *ORDINE CONFERMATO!*\n\n`;
      responseText += `📦 Totale articoli: ${session.orders.length}\n`;
      responseText += `💰 Totale: €${total.toFixed(2)}`;
      console.log(`🎉 Ordine confermato per @${username}! Totale: €${total.toFixed(2)}`);
    }

    bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
    console.log(`📤 Risposta inviata a @${username}`);

  } catch (error: any) {
    console.error(`\n❌ ERRORE per @${username}:`, error.message);
    console.error('Stack:', error.stack);
    bot.sendMessage(chatId, '❌ Mi dispiace, si è verificato un errore. Riprova tra poco.');
  }
});

// Gestione messaggi vocali
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const username = msg.from?.username || msg.from?.first_name || 'Sconosciuto';
  const voice = msg.voice;

  if (!userId || !voice) return;

  console.log(`\n🎤 Messaggio vocale ricevuto da @${username} (${voice.duration}s)`);

  let audioFilePath: string | null = null;

  try {
    // Mostra che sta "ascoltando"
    bot.sendChatAction(chatId, 'typing');
    bot.sendMessage(chatId, '🎧 Sto ascoltando il tuo messaggio vocale...');

    // 1. Scarica il file audio
    console.log(`⬇️  Download audio in corso...`);
    audioFilePath = await downloadVoiceFile(voice.file_id);
    console.log(`✅ Audio scaricato: ${audioFilePath}`);

    // 2. Trascrivi con Whisper
    console.log(`🔤 Trascrizione in corso...`);
    const transcribedText = await transcribeAudio(audioFilePath);
    console.log(`✅ Trascrizione completata: "${transcribedText.substring(0, 50)}..."`);

    // 3. Pulisci file temporaneo
    await cleanupAudioFile(audioFilePath);
    audioFilePath = null;

    // 4. Mostra la trascrizione all'utente
    bot.sendMessage(chatId, `📝 *Ho capito:* "${transcribedText}"`, { parse_mode: 'Markdown' });

    // 5. Processa il testo come un messaggio normale
    bot.sendChatAction(chatId, 'typing');

    // Recupera la sessione utente
    const session = await getUserSession(userId);

    // Leggi system prompt e menu
    const systemPrompt = await readSystemPrompt();
    const menuProducts = await readMenuProducts();

    // Crea messaggio utente
    const userMessage: Message = {
      role: 'user',
      content: transcribedText,
    };
    session.messages.push(userMessage);

    // Prepara il prompt con il menu e le ordinazioni correnti
    let enhancedSystemPrompt = systemPrompt;
    enhancedSystemPrompt += `\n\n${JSON.stringify(menuProducts, null, 2)}`;

    if (session.orders.length > 0) {
      enhancedSystemPrompt += `\n\nORDINAZIONI CORRENTI:\n${JSON.stringify(session.orders, null, 2)}\n\nQuando rispondi, includi sempre tutti i piatti ordinati nell'array "data", anche se non modificati.`;
    }

    // Chiama OpenAI
    const openAIMessages = [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...session.messages.slice(-5),
    ];

    console.log(`🤖 Chiamata a OpenAI (${session.messages.length} messaggi in sessione)...`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAIMessages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content || '{}';
    const parsedResponse: AIResponse = JSON.parse(responseContent);

    console.log(`✅ Risposta AI ricevuta: ${parsedResponse.data?.length || 0} articoli nell'ordine`);

    // Salva risposta dell'assistente
    const assistantMessage: Message = {
      role: 'assistant',
      content: JSON.stringify(parsedResponse),
    };
    session.messages.push(assistantMessage);

    // Aggiorna gli ordini
    if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
      session.orders = parsedResponse.data;
    }

    // Salva la sessione
    await saveUserSession(userId, session);

    // Invia risposta all'utente
    let responseText = parsedResponse.message;

    // Se l'ordine è chiuso, aggiungi il riepilogo
    if (parsedResponse.orderClosed && session.orders.length > 0) {
      const total = session.orders.reduce((sum, item) => sum + item.prezzo, 0);
      responseText += `\n\n✅ *ORDINE CONFERMATO!*\n\n`;
      responseText += `📦 Totale articoli: ${session.orders.length}\n`;
      responseText += `💰 Totale: €${total.toFixed(2)}`;
      console.log(`🎉 Ordine confermato per @${username}! Totale: €${total.toFixed(2)}`);
    }

    bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
    console.log(`📤 Risposta inviata a @${username}`);

  } catch (error: any) {
    console.error(`\n❌ ERRORE trascrizione per @${username}:`, error.message);
    console.error('Stack:', error.stack);

    // Pulisci file se esiste ancora
    if (audioFilePath) {
      await cleanupAudioFile(audioFilePath);
    }

    bot.sendMessage(chatId, '❌ Mi dispiace, non sono riuscito a capire il messaggio vocale. Puoi riprovare o scrivere un messaggio di testo?');
  }
});

// Gestione errori
bot.on('polling_error', (error) => {
  console.error('\n⚠️  Polling error:', error.message);
});

// Log periodico sessioni attive
setInterval(() => {
  if (userSessions.size > 0) {
    console.log(`\n📊 Sessioni attive: ${userSessions.size}`);
    userSessions.forEach((session, userId) => {
      console.log(`   👤 User ${userId}: ${session.messages.length} messaggi, ${session.orders.length} articoli`);
    });
  }
}, 300000); // Ogni 5 minuti

console.log('🎯 Bot in ascolto dei messaggi...');
