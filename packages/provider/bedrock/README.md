# @agenite/bedrock

AWS Bedrock provider for Agenite, enabling seamless integration with Amazon's foundation models through the Bedrock runtime.

## Features

- 🚀 Easy Integration - Simple setup with AWS Bedrock
- 🔄 Streaming Support - Real-time streaming responses
- 🛠️ Tool Integration - Native support for function calling
- 🎯 Model Selection - Support for multiple Bedrock models
- 🔐 AWS Authentication - Automatic credential management
- 🌐 Region Support - Configurable AWS regions

## Installation

```bash
npm install @agenite/bedrock
```

## Quick Start

```typescript
import { BedrockProvider } from '@agenite/bedrock';

// Initialize the provider
const provider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

// Generate a simple response
const result = await provider.generate(
  'What are the main features of Llama 2?'
);
console.log(result);

// Use streaming for real-time responses
const generator = provider.stream('Tell me about AWS Bedrock.');
for await (const chunk of generator) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.text);
  }
}
```

## Configuration

### Provider Options

```typescript
interface BedrockProviderOptions {
  model: string; // Bedrock model ID
  region: string; // AWS region
  temperature?: number; // Temperature for response generation
  maxTokens?: number; // Maximum tokens in response
  topP?: number; // Top P sampling parameter
}
```

### Available Models

- Anthropic Claude Models:
  - `anthropic.claude-3-5-haiku-20241022-v1:0`
  - `anthropic.claude-3-sonnet-20240229-v1:0`
  - `anthropic.claude-instant-v1`
- Amazon Titan Models:
  - `amazon.titan-text-express-v1`
  - `amazon.titan-text-lite-v1`

## Advanced Usage

### Usage with Claude 3.7 thinking

```typescript
const provider = new BedrockProvider({
  model: `us.anthropic.claude-3-7-sonnet-20250219-v1:0`,
  region: 'us-east-2',
  converseCommandConfig: {
    additionalModelRequestFields: {
      reasoning_config: {
        type: 'enabled',
        budget_tokens: 1024,
      },
    },
    inferenceConfig: {
      temperature: 1,
    },
  },
});
```

### Tool Integration

```typescript
import { BedrockProvider } from '@agenite/bedrock';
import type { ToolDefinition } from '@agenite/llm';

// Define a calculator tool
const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: 'Perform basic arithmetic operations',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
      },
      a: { type: 'number' },
      b: { type: 'number' },
    },
    required: ['operation', 'a', 'b'],
  },
};

// Initialize provider with tool support
const provider = new BedrockProvider({
  model: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  region: 'us-west-2',
});

// Use tool in conversation
const messages = [
  {
    role: 'user',
    content: [{ type: 'text', text: 'What is 123 multiplied by 456?' }],
  },
];

const generator = provider.iterate(messages, {
  tools: [calculatorTool],
  stream: true,
  systemPrompt:
    'You are a helpful AI assistant with access to a calculator tool.',
});

// Process streaming response with tool usage
for await (const chunk of generator) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.text);
  } else if (chunk.type === 'toolUse') {
    console.log('Tool Use:', chunk);
  }
}
```

### Conversation Management

```typescript
// Maintain conversation history
let messages = [];
const result = await provider.generate(messages, {
  systemPrompt: 'You are a helpful AI assistant.',
});
messages.push(
  { role: 'user', content: [{ type: 'text', text: 'Hello!' }] },
  result
);
```

## API Reference

### BedrockProvider Class

```typescript
class BedrockProvider implements LLMProvider {
  constructor(options: BedrockProviderOptions);

  generate(
    messages: string | BaseMessage[],
    options?: GenerateOptions
  ): Promise<BaseMessage>;

  stream(
    messages: string | BaseMessage[],
    options?: StreamOptions
  ): AsyncGenerator<StreamChunk>;

  iterate(
    messages: string | BaseMessage[],
    options?: StreamOptions
  ): AsyncGenerator<StreamChunk>;
}
```

### Message Types

```typescript
interface BaseMessage {
  role: 'user' | 'assistant' | 'system';
  content: ContentBlock[];
}

type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;
```

## Examples

Check out the [examples](./examples) directory for more:

- `basic-chat.ts` - Simple chat interaction
- `tool-usage.ts` - Advanced tool integration example

## AWS Setup

1. Install AWS CLI and configure credentials:

```bash
aws configure
```

2. Ensure your AWS account has access to Bedrock and the required models.

3. Set up IAM permissions for Bedrock access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
