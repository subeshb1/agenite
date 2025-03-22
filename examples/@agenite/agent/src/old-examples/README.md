# Agent Examples

This directory contains examples demonstrating different features and patterns of the agent system.

## Structure

- `basic/` - Simple examples showing core functionality
  - `simple-chat.ts` - Basic chat agent with calculator tool
- `advanced/` - More complex examples showing advanced features
  - `nested-agents.ts` - Demonstrates agent composition and nested execution
- `patterns/` - Common patterns and best practices

  - `agent-factory.ts` - Factory pattern and dependency injection

- `shared/` - Common utilities used by examples
  - `provider.ts` - Mock LLM provider implementation
  - `tools.ts` - Mock tool implementations

## Running Examples

1. Set up environment variables:

   ```bash
   export OPENAI_API_KEY=your_key_here
   export WEATHER_API_KEY=your_key_here
   ```

2. Run an example:

   ```bash
   # Basic example
   ts-node examples/basic/simple-chat.ts

   # Advanced example
   ts-node examples/advanced/nested-agents.ts

   # Patterns example
   ts-node examples/patterns/agent-factory.ts
   ```

## Example Details

### Basic Example (simple-chat.ts)

Shows:

- Basic agent setup
- Tool integration (calculator)
- Streaming responses
- Token usage tracking

### Advanced Example (nested-agents.ts)

Shows:

- Agent composition (travel agent using weather agent)
- Nested execution context
- Tool delegation
- Execution path tracking

### Patterns Example (agent-factory.ts)

Shows:

- Factory pattern for agent creation
- Dependency injection
- Custom logger implementation
- Agent composition pattern
- Execution context management

## Mock Implementations

The examples use mock implementations to demonstrate functionality without requiring real API keys:

- `OpenAIProvider` - Mock LLM provider that returns predefined responses
- `calculatorTool` - Real calculator implementation
- `weatherTool` - Mock weather tool that returns static data

These mocks can be replaced with real implementations in production.
