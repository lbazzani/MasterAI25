# File: agent.py
# Agente LangChain con tools - Ollama + DeepSeek R1 (ReAct text-based)

import os
import re
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import ALL_TOOLS

# Carica environment variables
load_dotenv()

# Configura LLM con Ollama (DeepSeek R1 8B locale)
llm = ChatOllama(
    model="deepseek-r1:8b",
    temperature=0,
    base_url="http://localhost:11434"
)

print(f"✅ LLM configured: Ollama - deepseek-r1:8b")
print(f"✅ Tools loaded: {len(ALL_TOOLS)}")

# Mappa dei tools per nome
TOOLS_MAP = {tool.name: tool for tool in ALL_TOOLS}

# Genera descrizione dei tools per il prompt
def get_tools_description():
    desc = []
    for tool in ALL_TOOLS:
        desc.append(f"- {tool.name}: {tool.description}")
    return "\n".join(desc)

# System prompt ReAct-style per modelli senza tool calling nativo
REACT_PROMPT = """You are a helpful travel assistant AI. You have access to these tools:

{tools_description}

To use a tool, respond with this EXACT format:
Action: tool_name
Action Input: {{"param1": "value1", "param2": "value2"}}

After receiving the tool result, provide your final answer.

If you don't need a tool, just respond directly.

IMPORTANT: 
- Use the EXACT tool names listed above
- Action Input must be valid JSON
- For get_weather and get_forecast, you need latitude and longitude (numbers)
- For search_location, provide a city/place name as query

User question: {input}

{agent_scratchpad}"""

prompt = ChatPromptTemplate.from_template(REACT_PROMPT)

# Chain base
chain = prompt | llm | StrOutputParser()

print("✅ Agent created and ready!")

def parse_action(response: str):
    """Estrae Action e Action Input dalla risposta."""
    action_match = re.search(r'Action:\s*(\w+)', response)
    input_match = re.search(r'Action Input:\s*(\{.*?\})', response, re.DOTALL)
    
    if action_match and input_match:
        action = action_match.group(1)
        try:
            import json
            action_input = json.loads(input_match.group(1))
            return action, action_input
        except json.JSONDecodeError:
            return None, None
    return None, None

def ask_agent(question: str, max_iterations: int = 5) -> str:
    """Esegue il loop ReAct: Think -> Action -> Observation -> Answer"""
    
    scratchpad = ""
    
    for i in range(max_iterations):
        # Chiedi al modello
        response = chain.invoke({
            "tools_description": get_tools_description(),
            "input": question,
            "agent_scratchpad": scratchpad
        })
        
        print(f"\n🤔 LLM Response:\n{response[:500]}...")
        
        # Prova a estrarre un'azione
        action, action_input = parse_action(response)
        
        if action and action in TOOLS_MAP:
            print(f"\n🔧 Executing: {action}({action_input})")
            
            # Esegui il tool
            tool = TOOLS_MAP[action]
            try:
                result = tool.invoke(action_input)
                print(f"📊 Result: {result[:200]}...")
            except Exception as e:
                result = f"Error: {e}"
            
            # Aggiungi al scratchpad
            scratchpad += f"\nAction: {action}\nAction Input: {action_input}\nObservation: {result}\n"
            scratchpad += "Now provide your final answer based on this information.\n"
        else:
            # Nessuna azione trovata, questa è la risposta finale
            # Rimuovi eventuali tag di thinking
            final = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
            return final.strip()
    
    return "Max iterations reached. Please try a simpler question."


if __name__ == "__main__":
    print("\n" + "="*60)
    print("   🌍 Travel Agent AI - Test Mode (DeepSeek R1)")
    print("="*60)
    
    # Test con una sola domanda per iniziare
    test_questions = [
        "What's the weather in Rome?",
    ]
    
    for q in test_questions:
        print(f"\n❓ Question: {q}")
        print("-" * 40)
        answer = ask_agent(q)
        print(f"\n💬 Answer: {answer}")
        print("=" * 60)
