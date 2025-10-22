# 🏗️ Architettura Bot Telegram

Panoramica dell'architettura e gestione dati del bot.

## 📊 Struttura Dati

### Sessioni Utente

Ogni utente Telegram ha la propria sessione isolata:

```typescript
interface UserSession {
  messages: Message[];    // Storico conversazione
  orders: MenuItem[];     // Articoli ordinati
}
```

### Storage

```
data/telegram-sessions/
├── user_123456789.json   ← Utente A
├── user_987654321.json   ← Utente B
└── user_555555555.json   ← Utente C
```

**Ogni file contiene:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Vorrei una Margherita"
    },
    {
      "role": "assistant",
      "content": "{\"data\":[...],\"message\":\"...\"}"
    }
  ],
  "orders": [
    {
      "nome": "Margherita",
      "descrizione": "Pomodoro, mozzarella...",
      "prezzo": 7.0,
      "categoria": "pizza"
    }
  ]
}
```

## 🔐 Isolamento Dati

### ✅ Cosa è Separato per Utente

| Dato | Isolamento |
|------|------------|
| **Conversazione** | ✅ Separata |
| **Ordini** | ✅ Separati |
| **File sessione** | ✅ Uno per utente |
| **Cache memoria** | ✅ Map per userId |

### 🌍 Cosa è Condiviso

| Risorsa | Condivisione |
|---------|--------------|
| Menu prodotti | ✅ Condiviso (read-only) |
| System prompt | ✅ Condiviso (read-only) |
| Bot instance | ✅ Condiviso |

## 🔄 Flusso Dati

### 1. Primo Messaggio Utente

```
Utente 123456789 → /start
        ↓
getUserSession(123456789)
        ↓
File non esiste → Crea nuova sessione
        ↓
{messages: [], orders: []}
        ↓
Salva in memoria (cache)
```

### 2. Ordinazione

```
Utente 123456789 → "Vorrei una Margherita"
        ↓
Carica sessione da cache
        ↓
Aggiungi messaggio user
        ↓
Chiama OpenAI
        ↓
Ricevi risposta con ordini: [{nome: "Margherita", ...}]
        ↓
Aggiorna session.orders
        ↓
Salva su file user_123456789.json
        ↓
Salva in cache
```

### 3. Utente Parallelo

```
Utente 987654321 → "Vorrei una Diavola"
        ↓
Carica sessione da cache (o file)
        ↓
Session INDIPENDENTE da user 123456789
        ↓
Processa ordine separatamente
        ↓
Salva su file user_987654321.json
```

## 🎯 Vantaggi Architettura

### ✅ Scalabilità

- **Utenti illimitati**: Ogni utente ha il proprio file
- **No conflitti**: Nessuna race condition tra utenti
- **Facile backup**: Backup per utente o totale

### ✅ Privacy

- **Dati isolati**: Un utente non vede ordini altrui
- **GDPR-ready**: Facile eliminare dati di un utente
- **Audit trail**: Ogni utente ha lo storico completo

### ✅ Performance

- **Cache in memoria**: Accesso rapido sessioni attive
- **Lazy loading**: File caricati solo quando necessari
- **Cleanup automatico**: File temporanei eliminati

## 📦 Esempio Multi-Utente

### Scenario

3 utenti ordinano contemporaneamente:

```
User A (ID: 111) → "Margherita"
User B (ID: 222) → "Diavola"
User C (ID: 333) → "Quattro Formaggi"
```

### Risultato

```
data/telegram-sessions/
├── user_111.json
│   └── orders: [Margherita]
├── user_222.json
│   └── orders: [Diavola]
└── user_333.json
    └── orders: [Quattro Formaggi]
```

**Ogni utente vede SOLO il proprio ordine!**

## 🔄 Confronto con Web App

| Feature | Web App | Bot Telegram |
|---------|---------|--------------|
| **Storage ordini** | Singolo file condiviso | File per utente |
| **Sessioni** | Globale | Per utente |
| **Concorrenza** | Problematica | Nessun problema |
| **Privacy** | Bassa | Alta |
| **Scalabilità** | Limitata | Eccellente |

### Web App (limitazione)

```
data/
├── messages.json      ← Tutti i messaggi
└── ordine.json        ← Tutti gli ordini (condivisi)
```

**Problema**: Se due utenti usano la web app, vedono gli stessi ordini!

### Bot Telegram (soluzione)

```
data/telegram-sessions/
├── user_111.json      ← Ordini utente A
├── user_222.json      ← Ordini utente B
└── user_333.json      ← Ordini utente C
```

**Soluzione**: Ogni utente ha ordini separati!

## 🛠️ Operazioni Comuni

### Visualizzare ordini di un utente

```bash
USER_ID=123456789
cat data/telegram-sessions/user_${USER_ID}.json | jq '.orders'
```

Output:
```json
[
  {
    "nome": "Margherita",
    "descrizione": "Pomodoro, mozzarella...",
    "prezzo": 7.0,
    "categoria": "pizza"
  }
]
```

### Contare ordini per utente

```bash
for f in data/telegram-sessions/user_*.json; do
  user_id=$(basename "$f" .json | cut -d'_' -f2)
  orders=$(jq '.orders | length' "$f")
  echo "User $user_id: $orders ordini"
done
```

### Totale ordini di un utente

```bash
USER_ID=123456789
jq '.orders | map(.prezzo) | add' data/telegram-sessions/user_${USER_ID}.json
```

### Statistiche globali

```bash
# Totale utenti
ls data/telegram-sessions/user_*.json | wc -l

# Totale ordini (tutti gli utenti)
for f in data/telegram-sessions/user_*.json; do
  jq '.orders | length' "$f"
done | awk '{s+=$1} END {print s}'
```

## 🔐 Sicurezza

### Isolamento Garantito

Il codice garantisce isolamento tramite:

1. **User ID come chiave**: `getUserSession(userId)`
2. **File separati**: `user_${userId}.json`
3. **Map separata**: `userSessions.get(userId)`

### No Cross-Contamination

```typescript
// ✅ SICURO: Ogni utente ha la propria sessione
const sessionA = await getUserSession(111);
const sessionB = await getUserSession(222);

// sessionA.orders !== sessionB.orders
// Modifiche a sessionA non influenzano sessionB
```

## 📈 Scalabilità

### Limiti Teorici

- **Utenti**: Illimitati (limitato solo da disco)
- **Ordini per utente**: Illimitati
- **Messaggi per utente**: Limitati a ultimi 5 in contesto AI
- **Dimensione file**: ~2-5KB per utente medio

### Ottimizzazioni

**Cache in memoria:**
- Sessioni attive in RAM
- Accesso O(1) via Map
- Scrittura asincrona su disco

**File system:**
- Un file per utente = parallellizzabile
- No lock globali
- Facile sharding per volume

## 🔄 Lifecycle Sessione

```
1. User invia messaggio
   ↓
2. getUserSession(userId)
   ↓
3a. Se in cache → Usa cache
3b. Se no → Carica da file
3c. Se file non esiste → Crea nuova
   ↓
4. Processa messaggio
   ↓
5. Aggiorna session.orders
   ↓
6. saveUserSession(userId, session)
   ↓
7a. Salva in cache (Map)
7b. Salva su file (JSON)
   ↓
8. Sessione pronta per prossimo messaggio
```

## 💡 Best Practices

### ✅ DO

- Usa sempre `getUserSession(userId)` per accedere ai dati
- Chiama sempre `saveUserSession()` dopo modifiche
- Log con userId per debugging
- Backup regolari della directory sessioni

### ❌ DON'T

- Non condividere sessioni tra utenti
- Non modificare file JSON manualmente mentre il bot è attivo
- Non usare variabili globali per gli ordini
- Non assumere che la cache sia sempre popolata

## 🎓 Conclusione

Il bot Telegram ha un'architettura **robusta e scalabile** con:

✅ **Ordini completamente separati per utente**
✅ **Nessun conflitto tra utenti**
✅ **Privacy garantita**
✅ **Performance ottimizzata**
✅ **GDPR-compliant**

Ogni utente ha la propria "bolla" isolata e sicura! 🛡️
