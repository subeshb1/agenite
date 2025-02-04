import { Agent } from '@agenite/agent';
import {
  webSearchTool,
  webScraperTool,
  fileManagerTool,
} from '../tools';
import { getLLMProvider } from '@agenite-examples/llm-provider';
const provider = getLLMProvider();

// Create specialized agents with their tools
const topicResearcherAgent = new Agent({
  name: 'topic_researcher',
  description: 'Researches topics and finds relevant sources',
  tools: [webSearchTool, fileManagerTool],
  provider: provider,
  systemPrompt: `You are a topic research specialist. Your workflow is:

1. INPUT: You receive a research query
2. PROCESS:
   - Use web_search to find relevant sources about the topic
   - For each source found:
     * Extract key information like company details, products, team, market position
     * Note any unique insights or data points
     * Identify areas needing deeper research
   - Format the results as JSON with:
     * All source URLs and their relevance
     * Key topics to research further
     * Specific questions to investigate
     * Areas of focus based on initial findings
     * Data points to verify or expand upon
   - Structure should include:
     {
       "sources": [{"url": "", "relevance": "", "key_points": []}],
       "research_topics": ["topic1", "topic2"],
       "investigation_areas": ["area1", "area2"],
       "data_verification": ["point1", "point2"]
     }
   - Use file_manager with action='write' and type='topics' to save
3. OUTPUT:
   - You MUST return the exact file path where you saved the results
   - Format: "Saved topic research to: /path/to/research/topics/timestamp-query.json"
   - This path will be used by the detail researcher`,
});

const detailResearcherAgent = new Agent({
  name: 'detail_researcher',
  description: 'Performs deep research on provided sources',
  tools: [webScraperTool, fileManagerTool],
  provider: provider,
  systemPrompt: `You are a detailed research specialist. Your workflow is:

1. INPUT: You receive a file path to topic research JSON
2. PROCESS:
   - Use file_manager with action='read' and type='topics' to load the research
   - For each research topic identified:
     * Use web_scraper on relevant source URLs to gather in-depth information
     * Analyze key aspects like:
       - Core concepts and definitions
       - Historical context and development
       - Current state and trends
       - Future implications
       - Expert opinions and insights
     * Cross-reference information across multiple sources
     * Identify and resolve any conflicting information
     * Document supporting evidence and citations
   - Format the results as detailed JSON with:
     * Comprehensive analysis of each topic
     * Supporting data and statistics
     * Expert quotes and perspectives
     * Industry trends and predictions
     * Relationships between topics
   - Use file_manager with action='write' and type='details' to save
3. OUTPUT:
   - You MUST return the exact file path where you saved the analysis
   - Format: "Saved detailed research to: /path/to/research/details/timestamp-query-detailed.json"
   - This path will be used by the blog writer`,
});

const blogWriterAgent = new Agent({
  name: 'blog_writer',
  description: 'Creates well-structured blog posts from research',
  tools: [fileManagerTool],
  provider: provider,
  systemPrompt: `You are a professional blog writer. Your workflow is:

1. INPUT: 
   - A file path to detailed research JSON
   - Style preferences (tone and format)

2. PROCESS:
   - Use file_manager with action='read' and type='details' to load the research
   - Create a well-structured markdown blog post with:
     * Title
     * Introduction
     * Main sections based on research
     * Conclusion
     * References to sources
   - Use file_manager with action='write' and type='blog' to save the markdown

3. OUTPUT:
   - You MUST return the exact file path to the created blog post
   - Format: "Created blog post at: /path/to/blogs/YYYY-MM-DD-title.md"


\`\`\``,
});

// Create the orchestrator agent
export const blogOrchestratorAgent = new Agent({
  name: 'blog_orchestrator',
  description: 'Orchestrates the entire blog creation process',
  provider: provider,
  tools: [topicResearcherAgent, detailResearcherAgent, blogWriterAgent],
  systemPrompt: `You are the orchestrator of a multi-agent blog creation system. You coordinate three specialized agents:

- topic_researcher: Finds and saves initial research
- detail_researcher: Analyzes sources in depth
- blog_writer: Creates the final blog post

INPUT FORMAT:
{
  "query": "The main topic to research",
  "style": {
    "tone": "technical|conversational|educational",
    "format": "long-form|listicle|tutorial"
  }
}

OUTPUT FORMAT:
You MUST output progress messages in this exact format:
🔍 "Starting research: {query}"
📚 "Topic research saved: {path}"
🔬 "Detailed analysis saved: {path}"
✍️ "Blog post created: {path}"

IMPORTANT:
- Always pass the exact file paths between agents
- Track and display each step's progress
- The final blog post path is your ultimate output`,
});
