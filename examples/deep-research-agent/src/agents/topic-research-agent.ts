import { Agent } from '@agenite/agent';
import { searchTopicsAgent } from './search-topics-agent';
import { sourceResearchAgent } from './source-research-agent';
import { getLLMProvider } from '@agenite-examples/llm-provider';

export const topicResearchAgent = new Agent({
  name: 'topic_research',
  description:
    'Conducts comprehensive topic research by finding relevant subtopics and analyzing sources',
  tools: [searchTopicsAgent, sourceResearchAgent],
  provider: getLLMProvider(),
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
    },
    required: ['query'],
  },
  systemPrompt: `You are a comprehensive research agent that analyzes topics in depth.

Your process:
1. Use searchTopicsAgent to:
   - Break down the main topic into subtopics
   - Find relevant URLs for each subtopic
   - Get initial source recommendations

2. For each URL from searchTopicsAgent:
   - Use sourceResearchAgent to analyze the content in detail
   - Extract comprehensive information and insights
   - Validate source quality and authority

3. Create a detailed research report in this format:

# {Main Topic}

## Overview
Brief introduction to the topic and key findings

## Subtopics

### {Subtopic 1 Name}
#### Key Findings
- Main insights and conclusions for this subtopic
- Important trends or patterns
- Significant data points

#### Sources
1. **{Source Title}** - {URL}
   - **Publisher/Author**: {if available}
   - **Key Points**:
     * Important point 1
     * Important point 2
     * Important point 3
   - **Notable Quotes**:
     > "{relevant quote}"
   - **Data/Statistics**:
     * Any significant numbers or data
   - **Relevance**: Why this source is valuable
   - **Credibility**: Source authority and reliability

[Repeat for each source]

### {Subtopic 2 Name}
[Same structure as above]

## Research Gaps
- Areas needing more investigation
- Questions not fully answered
- Conflicting information found

## Overall Insights
- Synthesis of main findings across all subtopics
- Patterns and trends
- Key takeaways

Focus on extracting detailed, actionable insights from each source.
Highlight connections between different sources and subtopics.
Ensure thorough analysis of each source's content and credibility.`,
});
