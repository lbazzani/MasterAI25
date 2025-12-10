# File: main.py
# Parte 1: Imports e configurazione

import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
from langchain_openai import ChatOpenAI

# Carica environment variables
load_dotenv()

# Configura LLM (OpenAI)
llm = ChatOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    model="gpt-4o-mini"
)

print("✅ Configuration loaded")
print(f"Using model: {llm.model_name}")

# Parte 2: Inizializza tools
search_tool = SerperDevTool()
scrape_tool = ScrapeWebsiteTool()

# Research Agent - cerca informazioni online
researcher = Agent(
    role="Senior Research Analyst",
    goal="Discover cutting-edge developments in {topic}",
    backstory="""You are an expert researcher with years of experience
    in finding and analyzing technical information. You excel at finding
    reliable sources and extracting key insights from complex data. Rispondi sempre in italiano.""",
    verbose=True,
    allow_delegation=False,
    tools=[search_tool, scrape_tool],
    llm=llm
)

print(f"✅ {researcher.role} created with {len(researcher.tools)} tools")

# Analyst Agent - analizza dati del researcher
analyst = Agent(
    role="Content Analyst",
    goal="Analyze research findings on {topic} and identify key insights",
    backstory="""You're a meticulous analyst with a keen eye for detail.
    You excel at synthesizing information from multiple sources and
    identifying patterns, trends, and actionable insights. Rispondi sempre in italiano.""",
    verbose=True,
    allow_delegation=False,
    llm=llm
)

# Writer Agent - scrive article finale
writer = Agent(
    role="Tech Content Writer",
    goal="Write engaging technical article about {topic}",
    backstory="""You're an acclaimed tech writer known for clear,
    concise, and engaging content. You make complex technical topics
    accessible to a wide audience without dumbing them down. Rispondi sempre in italiano.""",
    verbose=True,
    allow_delegation=False,
    llm=llm
)

print(f"✅ All 3 agents created: Researcher, Analyst, Writer")

# Parte 3: Definiamo i tasks
research_task = Task(
    description="""Research the latest developments in {topic}.
    Focus on:
    - Recent news and announcements (last 6 months)
    - Key technologies, frameworks, and tools
    - Industry trends and adoption rates
    - Real-world use cases and applications
    Find at least 5 reliable sources. rispondi sempre in italiano.""",
    expected_output="Detailed research report with sources and URLs",
    agent=researcher
)

analysis_task = Task(
    description="""Analyze the research findings and identify:
    - Top 3-5 most important trends
    - Key players (companies, projects, tools)
    - Practical implications for developers
    - Challenges and limitations
    Structure findings in clear, logical sections. rispondi sempre in italiano.""",
    expected_output="Structured analysis with key insights and trends",
    agent=analyst
)

print(f"✅ Created {2} tasks (research + analysis)")

# Writing task
writing_task = Task(
    description="""Write a technical article about {topic}:
    - Engaging introduction hook
    - Clear explanation of key concepts
    - Practical examples and use cases
    - Current trends and future outlook
    - Conclusion with key takeaways
    Target: 800-1000 words, technical but accessible. rispondi sempre in italiano.""",
    expected_output="Complete article in markdown format",
    agent=writer
)

# Assembla la Crew
crew = Crew(
    agents=[researcher, analyst, writer],
    tasks=[research_task, analysis_task, writing_task],
    process=Process.sequential,
    verbose=True
)

print(f"✅ Crew assembled with {len(crew.tasks)} tasks")

# Parte 4: Funzione esecuzione principale
def run_research(topic):
    """Esegue ricerca multi-agent su un topic"""
    print(f"\n{'='*60}")
    print(f"🚀 Starting AI research on: {topic}")
    print(f"{'='*60}")
    print("\nThis will take 2-5 minutes...\n")
    
    try:
        result = crew.kickoff(inputs={'topic': topic})
        
        # Salva su file
        filename = f"output/article_{topic.replace(' ', '_')}.md"
        os.makedirs('output', exist_ok=True)
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(str(result))
        
        print(f"\n{'='*60}")
        print(f"✅ Article saved to: {filename}")
        print(f"{'='*60}")
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Parte 5: Entry point
if __name__ == "__main__":
    print("\n" + "="*60)
    print("   CrewAI Multi-Agent Research System")
    print("="*60)
    
    topic = input("\nEnter research topic: ").strip()
    
    if not topic:
        print("❌ Topic cannot be empty")
        exit(1)
    
    result = run_research(topic)
    
    if result:
        print("\n📄 Preview (first 500 chars):")
        print("-" * 60)
        print(str(result)[:500] + "...")
        print("-" * 60)
        print("\n✅ Done! Check the output folder for full article.")