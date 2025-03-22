# Deep Research Agent

An advanced AI-powered research assistant that creates comprehensive, well-researched blog posts on any topic by combining web search, content analysis, and automated writing capabilities.

## Features

- 🔍 Intelligent web searching across multiple sources
- 📝 Automated content extraction and analysis
- ✍️ Well-structured blog post generation
- 📚 Proper citation and source attribution
- 💾 Organized research storage

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- pnpm (recommended) or npm
- Ollama (if using default LLM provider)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd deep-research-agent
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

## Environment Variables

The agent uses environment variables for LLM configuration. Create a `.env` file in the root directory:

```env
# LLM Provider Configuration (Optional)
LLM_PROVIDER=ollama    # Options: 'ollama' (default) or 'bedrock'
LLM_MODEL_ID=llama3.2  # Default model for Ollama

# If using AWS Bedrock (only needed if LLM_PROVIDER=bedrock)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-west-2
```

By default, the agent uses Ollama with the llama3.2 model. Make sure you have Ollama installed and the model downloaded if using the default configuration.

## Usage

Run the agent with a research query:

```bash
pnpm start -- "your research query"
# or
npm start -- "your research query"
```

Examples:
```bash
pnpm start -- "What are the latest developments in quantum computing?"
pnpm start -- "What is the current state of renewable energy?"
```

## How It Works

The Deep Research Agent follows a sophisticated process to create high-quality blog posts:

1. **Web Search**: 
   - Searches for the most relevant and authoritative sources
   - Identifies key resources and references

2. **Content Analysis**:
   - Scrapes and analyzes content from selected sources
   - Extracts important information and insights
   - Maintains source attribution

3. **Content Generation**:
   - Synthesizes information from multiple sources
   - Creates well-structured blog posts
   - Includes proper citations and references

4. **Output**:
   - Saves the generated blog post in the `research` directory
   - Provides progress updates during the research process
   - Shows token usage statistics upon completion

## Output Structure

The agent creates a `research` directory containing:
- Generated blog post in markdown format
- Source attribution and references
- Metadata about the research process

## Notes

- The research process may take several minutes depending on the topic complexity
- Internet connection is required for web search and content analysis
- The quality of results depends on the availability of reliable sources
- Token usage is tracked and displayed after completion

## License

MIT
