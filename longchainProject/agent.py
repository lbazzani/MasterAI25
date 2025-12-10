# File: agent.py
# Agente LangChain con tools

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from tools import ALL_TOOLS

# Carica environment variables
load_dotenv()

# Configura LLM
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=os.getenv("OPENAI_API_KEY")
)

print(f"✅ LLM configured: {llm.model_name}")
print(f"✅ Tools loaded: {len(ALL_TOOLS)}")

# System prompt che definisce il comportamento dell'agente
SYSTEM_PROMPT = """You are a helpful travel assistant AI. You help users with:
- Finding information about destinations (cities, countries)
- Checking current weather and forecasts
- Converting currencies
- Providing travel tips and recommendations

When answering questions:
1. Use the search_location tool to find coordinates of places
2. Use get_weather or get_forecast for weather information
3. Use get_country_info for country details (currency, language, etc.)
4. Use convert_currency for money conversions

Always provide helpful, accurate information based on the tool results.
If you need multiple pieces of information, call multiple tools.
Be concise but complete in your responses.

Respond in the same language the user uses (Italian or English)."""

# Crea prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])

# Crea l'agente con tools
agent = create_openai_tools_agent(
    llm=llm,
    tools=ALL_TOOLS,
    prompt=prompt
)

# Crea l'executor (gestisce il loop agentico)
agent_executor = AgentExecutor(
    agent=agent,
    tools=ALL_TOOLS,
    verbose=True,  # Mostra reasoning dell'agente
    handle_parsing_errors=True,
    max_iterations=10  # Limite iterazioni per sicurezza
)

print("✅ Agent created and ready!")

# Funzione helper per invocare l'agente
def ask_agent(question: str, chat_history: list = None) -> str:
    """Invia domanda all'agente e ritorna risposta."""
    result = agent_executor.invoke({
        "input": question,
        "chat_history": chat_history or []
    })
    return result["output"]

# Test standalone

if __name__ == "__main__":
    print("\n" + "="*60)
    print("   🌍 Travel Agent AI - Test Mode")
    print("="*60)
    
    # Test query semplice
    test_questions = [
        "Che tempo fa a Milano?",
        "Dimmi qualcosa sul Giappone",
        "Converti 100 euro in yen"
    ]
    
    for q in test_questions:
        print(f"\n❓ Question: {q}")
        print("-" * 40)
        answer = ask_agent(q)
        print(f"\n💬 Answer: {answer}")
        print("=" * 60)