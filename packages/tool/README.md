# @agenite/tool

A TypeScript library for creating strongly-typed, schema-validated tools that can be used with AI agents.

## Features

- 🔒 Type Safety - Full TypeScript support with generic types
- ✅ Schema Validation - Built-in JSON Schema validation using Ajv
- 🛠️ Flexible Tools - Create simple to complex tools with ease
- 🔌 API Integration - Seamlessly wrap external APIs as tools
- 🎯 Error Handling - Structured error responses and handling
- 📦 Zero Dependencies - Minimal core with optional schema validation

## Installation

```bash
npm install @agenite/tool
```

## Quick Start

```typescript
import { Tool } from '@agenite/tool';

// Define input type
interface CalculatorInput {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
}

// Create a tool
const calculatorTool = new Tool<CalculatorInput>({
  name: 'calculator',
  description: 'Perform basic math operations',
  version: '1.0.0',
  inputSchema: {
    type: 'object',
    properties: {
      operation: { type: 'string' },
      a: { type: 'number' },
      b: { type: 'number' },
    },
    required: ['operation', 'a', 'b'],
  },
  execute: async ({ input }) => {
    const { operation, a, b } = input;
    
    try {
      let result: number;
      switch (operation) {
        case 'add': result = a + b; break;
        case 'subtract': result = a - b; break;
        case 'multiply': result = a * b; break;
        case 'divide': 
          if (b === 0) throw new Error('Division by zero');
          result = a / b; 
          break;
        default: throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        isError: false,
        data: result.toString(),
      };
    } catch (error) {
      return {
        isError: true,
        data: error.message,
        error: {
          code: 'CALCULATION_ERROR',
          message: error.message,
        },
      };
    }
  },
});
```

## Core Concepts

### Tool Definition

A tool consists of:
- `name` - Unique identifier for the tool
- `description` - Clear description of what the tool does
- `version` - Semantic version number
- `inputSchema` - JSON Schema for input validation
- `execute` - Async function that performs the tool's operation

### Input Validation

Tools use JSON Schema for input validation:
- Define schema matching your TypeScript interface
- Automatic validation before execution
- Type-safe input handling

### Error Handling

Structured error responses:
- `success` - Boolean indicating success/failure
- `data` - String result or error message
- `error` - Optional error details with code and message

## Advanced Usage

### API Integration

Wrap external APIs as tools:

```typescript
interface WeatherInput {
  city: string;
  units?: 'metric' | 'imperial';
}

// Create a tool factory with API client
export const createWeatherTool = (apiKey: string) => {
  const client = new WeatherAPI(apiKey);

  return new Tool<WeatherInput>({
    name: 'weather',
    description: 'Get current weather for a city',
    version: '1.0.0',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        units: { type: 'string' },
      },
      required: ['city'],
    },
    execute: async ({ input }) => {
      try {
        const weather = await client.getWeather(input.city, input.units);
        return { isError: false, data: weather };
      } catch (error) {
        return {
          isError: true,
          data: `Failed to get weather: ${error}`,
          error: {
            code: 'WEATHER_ERROR',
            message: error.message,
          },
        };
      }
    },
  });
};
```

### Custom Schema Validation

Use Zod or other schema validators:

```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const inputSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number(),
});

const calculatorTool = new Tool<z.infer<typeof inputSchema>>({
  // ... other options
  inputSchema: zodToJsonSchema(inputSchema),
});
```

## API Reference

### Tool Constructor

```typescript
new Tool<TInput>({
  name: string;
  description: string;
  version: string;
  inputSchema: JSONSchema;
  execute: (context: {
    input: TInput;
    executionId?: string;
  }) => Promise<ToolResult>;
})
```

### Tool Result

```typescript
interface ToolResult {
  isError: boolean;
  data: string;
  error?: {
    code: string;
    message: string;
  };
}
```

## Examples

Check out the [examples](./examples) directory for more:

- `calculator.ts` - Basic calculator tool implementation
- `weather.ts` - External API integration example

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
