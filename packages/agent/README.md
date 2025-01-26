# @agenite/agent

A simple and maintainable TypeScript library for building AI agents with tool integration capabilities.

## Features

- 🛠️ Tool Integration - Easily integrate custom tools and APIs
- 🔄 Stateful Conversations - Maintain conversation history and context
- 🌊 Streaming Support - Real-time streaming of agent responses
- 🎯 Execution Context - Track and manage nested agent executions
- 🔌 Provider Agnostic - Support for multiple LLM providers (Ollama, Bedrock)
- 🎨 Flexible Architecture - Build simple to complex agent hierarchies

## Installation

```bash
npm install @agenite/agent
```

## Quick Start

```typescript
import { Agent } from '@agenite/agent';
import { OllamaProvider } from '@agenite/ollama';

// Create a simple calculator tool
const calculatorTool = new Tool({
  name: 'calculator',
  description: 'Perform basic math operations',
  execute: async ({ input }) => {
    // Tool implementation
    return { success: true, data: result.toString() };
  }
});

// Initialize the agent
const agent = new Agent({
  name: 'math-buddy',
  provider: new OllamaProvider({ model: 'llama2' }),
  tools: [calculatorTool],
  systemPrompt: 'You are a helpful math assistant.'
});

// Execute the agent
const result = await agent.execute({
  messages: 'What is 1234 * 5678?',
  stream: true // Enable streaming
});
```

## Core Concepts

### Agent

The main class that orchestrates interactions between the LLM and tools. It handles:
- Message processing
- Tool execution
- Response streaming
- State management

### Tools

Tools are functions that agents can use to perform specific tasks. Each tool has:
- Name and description
- Input schema
- Execute function
- Version information

### Providers

LLM providers that handle the actual language model interactions:
- Ollama
- Amazon Bedrock
- Extensible for other providers

## Advanced Usage

### Stateful Agent

Maintain conversation history and state across multiple interactions:

```typescript
const agent = new Agent({
  name: 'stateful-calculator',
  provider,
  tools: [calculatorTool],
  systemPrompt: `You are a helpful math assistant that maintains a running total.`
});

let messages = [];
const result = await agent.execute({
  messages: [...messages, { role: 'user', content: query }],
  stream: true
});
messages = result.messages;
```

### Nested Agents

Create hierarchical agent structures where agents can delegate tasks:

```typescript
// Specialist agents
const calculatorAgent = new Agent({
  name: 'calculator-specialist',
  provider,
  tools: [calculatorTool]
});

const weatherAgent = new Agent({
  name: 'weather-specialist',
  provider,
  tools: [weatherTool]
});

// Coordinator agent
const coordinatorAgent = new Agent({
  name: 'coordinator',
  provider,
  tools: [
    createDelegateTool('askCalculator', calculatorAgent),
    createDelegateTool('askWeather', weatherAgent)
  ]
});
```

### Streaming Responses

Process agent responses in real-time:

```typescript
const iterator = agent.iterate({
  messages: 'Your query here',
  stream: true
});

for await (const chunk of iterator) {
  switch (chunk.type) {
    case 'streaming':
      console.log(chunk.response.text);
      break;
    case 'toolUse':
      console.log('Using tool:', chunk.tools[0]?.tool);
      break;
    // Handle other chunk types
  }
}
```

## API Reference

### Agent Constructor

```typescript
new Agent({
  name: string;
  provider: LLMProvider;
  tools?: Tool[];
  systemPrompt?: string;
})
```

### Execute Method

```typescript
execute({
  messages: string | BaseMessage[];
  stream?: boolean;
  context?: ExecutionContext;
}): Promise<ExecutionResult>
```

### Iterate Method

```typescript
iterate({
  messages: string | BaseMessage[];
  stream?: boolean;
  context?: ExecutionContext;
}): AsyncIterator<StreamChunk>
```

## Examples

Check out the [examples](./examples) directory for more detailed examples:

- `basic/` - Simple examples showing core functionality
  - `simple-chat.ts` - Basic chat agent with calculator tool
- `advanced/` - More complex examples
  - `nested-agents.ts` - Agent composition and delegation
  - `stateful-agent.ts` - Maintaining conversation state
  - `streaming-agent.ts` - Real-time response streaming
  - `multi-tool-agent.ts` - Using multiple tools

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
