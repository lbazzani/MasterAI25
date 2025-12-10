# File: main.py
# Entry point con chat loop interattivo

from agent import ask_agent

def main():
    print("\n" + "="*60)
    print("   🌍 Travel Agent AI - Interactive Mode (DeepSeek R1)")
    print("="*60)
    print("\nCiao! Sono il tuo assistente di viaggio AI.")
    print("Posso aiutarti con: meteo, info paesi, conversioni valuta.")
    print("\nComandi speciali:")
    print("  'quit' o 'exit' - Esci")
    print("="*60)
    
    while True:
        try:
            user_input = input("\n👤 Tu: ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Arrivederci! Buon viaggio!")
                break
            
            # Chiedi all'agente
            print("\n🤔 Sto pensando...")
            response = ask_agent(user_input)
            
            print(f"\n🤖 Agente: {response}")
            
        except KeyboardInterrupt:
            print("\n\n👋 Interrotto. Arrivederci!")
            break
        except Exception as e:
            print(f"\n❌ Errore: {e}")
            continue

if __name__ == "__main__":
    main()
