# AI Coding Agent

An intelligent coding assistant powered by the @agenite framework that helps with coding tasks, code analysis, and file operations. This agent acts as your pair programming partner, capable of understanding and modifying code, answering questions, and providing assistance with development tasks.

## Features

- 🔍 **Code Analysis**: Finds functions, imports, and analyzes code structure
- 📝 **Code Generation**: Creates and modifies code with proper formatting
- 🛠️ **File Operations**: Handles file system tasks (read, write, list)
- 💡 **Interactive Assistance**: Provides explanations and suggestions
- 🎨 **Beautiful Output**: Rich console output with icons and colors
- 🔄 **Development Flow**: Seamless integration with your coding workflow

## Architecture

The agent uses a modular architecture with specialized tools:

### Command Runner Tool
- Executes shell commands safely
- Handles command timeouts
- Caches recent command results
- Provides detailed command output

### File System Tool
- Reads and writes files
- Lists directory contents
- Handles file operations safely
- Supports various file types

## Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd coding-agent

# Install dependencies
npm install
```

## Usage

Start the agent and interact with it:

```bash
npm start
```

Example commands:
```bash
# Analyze code
"Can you analyze the code in src/agent.ts?"

# Find functions
"What functions are defined in src/tools/file-system.ts?"

# Make modifications
"Add error handling to the readFile function"

# Get explanations
"Explain how the command runner tool works"
```

## Project Structure

```
coding-agent/
├── src/
│   ├── agent.ts           # Main agent implementation
│   ├── index.ts          # Entry point
│   └── tools/            # Tool implementations
│       ├── command-runner.ts  # Command execution
│       └── file-system.ts     # File operations
├── tests/                # Test files
└── package.json
```

## Configuration

The agent uses environment variables for configuration:

```bash
# LLM Provider Configuration
export LLM_PROVIDER=ollama     # or 'bedrock'
export LLM_MODEL_ID=llama3.2   # or other supported models

# Optional Configuration
export COMMAND_TIMEOUT=30000   # Command timeout in ms
export CACHE_DURATION=60000    # Cache duration in ms
```

## Features in Detail

### Code Analysis
- Function and class detection
- Import statement analysis
- Code structure understanding
- Dependency tracking

### File Operations
- Safe file reading/writing
- Directory exploration
- File type detection
- Path resolution

### Command Execution
- Safe command running
- Output capturing
- Error handling
- Result caching

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

Watch mode for TypeScript:
```bash
npm run watch
```

## Error Handling

The agent handles various scenarios:
- Invalid commands
- File system errors
- Syntax errors
- Timeout issues
- Permission problems

## Best Practices

When using the agent:
1. Be specific with your requests
2. Provide full file paths when needed
3. Review suggested changes before applying
4. Use version control for safety

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Dependencies

Core dependencies:
- `@agenite/agent`: Core agent framework
- `@agenite/tool`: Tool creation utilities
- `shared-llm-provider`: LLM provider implementation

Dev dependencies:
- `typescript`: Type support
- `tsx`: TypeScript execution
- `@types/node`: Node.js type definitions

## License

MIT License

## Acknowledgments

- Built with @agenite framework
- Inspired by pair programming practices
- Uses modern AI techniques for code understanding 
