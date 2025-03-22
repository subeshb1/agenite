import { Tool } from '@agenite/tool';

interface CalculatorInput {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
}

interface WeatherInput {
  city: string;
  units?: 'metric' | 'imperial';
}

// Mock calculator tool
export const calculatorTool = new Tool<CalculatorInput>({
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
    let result: number;

    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          return {
            isError: true,
            data: 'Division by zero',
            error: {
              code: 'DIVISION_BY_ZERO',
              message: 'Cannot divide by zero',
            },
          };
        }
        result = a / b;
        break;
      default:
        return {
          isError: true,
          data: `Unknown operation: ${operation}`,
          error: {
            code: 'INVALID_OPERATION',
            message: `Operation ${operation} not supported`,
          },
        };
    }

    return {
      isError: false,
      data: result.toString(),
    };
  },
});

// Mock weather tool factory
export const createWeatherTool = (_apiKey: string) => {
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
      const { city, units = 'metric' } = input;

      // Mock weather data
      return {
        isError: false,
        data: `Temperature in ${city}: 22°${units === 'metric' ? 'C' : 'F'}`,
      };
    },
  });
};
