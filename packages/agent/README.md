# @agenite/agent

A powerful and flexible TypeScript library for building AI agents with advanced tool integration and state management capabilities.

## Features

- 🛠️ Advanced tool integration - Seamlessly integrate custom tools and APIs with type safety
- 🔄 Stateful conversations - Built-in state management with custom reducers
- 🌊 Streaming support - Real-time streaming of agent responses and tool executions
- 🎯 Execution context - Track and manage nested agent executions with context inheritance
- 🔌 Provider agnostic - Support for multiple LLM providers (Ollama, Bedrock)
- 🎨 Flexible architecture - Build simple to complex agent hierarchies with middleware support
- 📊 Token usage tracking - Monitor and optimize token consumption across executions
- 🔄 Step-based execution - Fine-grained control over agent execution flow

## Installation

```bash
npm install @agenite/agent
```

## Quick start

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
  },
});

// Initialize the agent
const agent = new Agent({
  name: 'math-buddy',
  provider: new OllamaProvider({ model: 'llama2' }),
  tools: [calculatorTool],
  instructions: 'You are a helpful math assistant.',
});

// Execute the agent
const result = await agent.execute({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'What is 1234 * 5678?' }] }],
});
```

## Core concepts

### Agent

The main class that orchestrates interactions between the LLM and tools. It handles:

- Message processing and state management
- Tool execution and result handling
- Response streaming
- Nested agent execution
- Token usage tracking

### Tools

Tools are functions that agents can use to perform specific tasks. Each tool has:

- Name and description
- Input schema with type safety
- Execute function with context support
- Error handling capabilities

### Providers

LLM providers that handle the actual language model interactions:

- Ollama
- Amazon Bedrock
- Extensible for other providers

### Steps

The agent execution is broken down into steps:

- `llm-call` - Handles LLM interactions
- `tool-call` - Manages tool execution
- `tool-result` - Processes tool results
- `agent-call` - Handles nested agent execution

## Advanced usage

### Stateful agent with custom reducer

```typescript
const customReducer = {
  messages: (newValue, previousValue) => [
    ...(previousValue || []),
    ...(newValue || []),
  ],
  runningTotal: (newValue, previousValue) =>
    (previousValue || 0) + (newValue || 0),
};

const agent = new Agent({
  name: 'stateful-calculator',
  provider,
  tools: [calculatorTool],
  stateReducer: customReducer,
  initialState: {
    runningTotal: 0,
  },
  instructions:
    'You are a helpful math assistant that maintains a running total.',
});
```

### Nested agents with delegation

```typescript
// Specialist agents
const calculatorAgent = new Agent({
  name: 'calculator-specialist',
  provider,
  tools: [calculatorTool],
  description: 'Specializes in mathematical calculations',
});

const weatherAgent = new Agent({
  name: 'weather-specialist',
  provider,
  tools: [weatherTool],
  description: 'Provides weather information',
});

// Coordinator agent
const coordinatorAgent = new Agent({
  name: 'coordinator',
  provider,
  agents: [calculatorAgent, weatherAgent],
  instructions:
    'Coordinate between specialist agents to solve complex problems.',
});
```

### Streaming responses with middleware

```typescript
const agent = new Agent({
  name: 'streaming-agent',
  provider,
  tools: [calculatorTool],
  middlewares: [
    executionContextInjector(),
    // Add custom middleware here
  ],
});

const iterator = agent.iterate({
  messages: [{ role: 'user', content: [{ type: 'text', text: 'Your query here' }] }],
  stream: true,
});

for await (const chunk of iterator) {
  switch (chunk.type) {
    case 'agenite.llm-call.streaming':
      console.log(chunk.content);
      break;
    case 'agenite.tool-call.params':
      console.log('Using tool:', chunk.toolUseBlocks);
      break;
    case 'agenite.tool-result':
      console.log('Tool result:', chunk.result);
      break;
  }
}
```

## API reference

### Agent constructor

```typescript
new Agent({
  name: string;
  provider: LLMProvider;
  tools?: Tool[];
  instructions?: string;
  description?: string;
  agents?: Agent[];
  stateReducer?: CustomStateReducer;
  initialState?: Partial<StateFromReducer<CustomStateReducer>>;
  steps?: Steps;
  middlewares?: Middlewares;
})
```

### Execute method

```typescript
execute({
  messages: BaseMessage[];
  stream?: boolean;
  context?: Record<string, unknown>;
}): Promise<ExecutionResult>
```

### Iterate method

```typescript
iterate({
  messages: BaseMessage[];
  stream?: boolean;
  context?: Record<string, unknown>;
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
