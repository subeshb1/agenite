# @agenite/ollama

Ollama provider for Agenite, enabling seamless integration with local Ollama models.

## Features

- 🚀 Support for all Ollama models (Llama 2, CodeLlama, Mistral, etc.)
- 🛠️ Function/tool calling support
- 🖼️ Image input support (with multimodal models)
- 📝 Rich content types (text, images, tool calls)
- 🔄 Streaming responses
- ⚙️ Extensive model parameter controls

## Installation

```bash
npm install @agenite/ollama
```

Make sure you have [Ollama](https://ollama.ai) installed and running locally.

## Usage

### Basic Chat

```typescript
import { OllamaProvider } from '@agenite/ollama';

const provider = new OllamaProvider({
  model: 'llama2',
  host: 'http://localhost:11434',
  temperature: 0.7,
});

const messages = [
  {
    role: 'user',
    content: [{ type: 'text', text: 'What are the main features of Llama 2?' }],
  },
];

const response = await provider.generate({ messages });
console.log(response.content[0].text);
```

### Tool Usage

```typescript
const calculatorTool = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations',
  parameters: {
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

const response = await provider.generate({
  messages: [
    {
      role: 'user',
      content: [{ type: 'text', text: 'What is 123 multiplied by 456?' }],
    },
  ],
  tools: [calculatorTool],
});
```

### Image Input

```typescript
const provider = new OllamaProvider({
  model: 'llava',
  host: 'http://localhost:11434',
});

const response = await provider.generate({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageBase64,
          },
        },
        { type: 'text', text: 'What do you see in this image?' },
      ],
    },
  ],
});
```

## Configuration

The provider accepts the following configuration options:

```typescript
interface OllamaConfig {
  model: string;           // Model name (e.g., 'llama2', 'codellama')
  host?: string;          // Ollama server URL (default: http://localhost:11434)
  temperature?: number;   // Generation temperature (0-1)
  maxTokens?: number;    // Maximum tokens to generate
  systemPrompt?: string; // System prompt for all conversations
  parameters?: {         // Additional model parameters
    mirostat?: number;
    num_ctx?: number;
    num_gpu?: number;
    // ... and more
  };
}
```

## Examples

Check out the `examples` directory for more detailed examples:
- `basic-chat.ts`: Simple text conversation
- `tool-usage.ts`: Calculator tool implementation
- `image-input.ts`: Image analysis with multimodal models

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run examples
npx ts-node examples/basic-chat.ts
```

## License

MIT 
