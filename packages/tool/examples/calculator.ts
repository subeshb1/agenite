import { Tool, SchemaType } from '../src';

interface CalculatorInput {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
}

const calculatorSchema: SchemaType<CalculatorInput> = {
  type: 'object',
  properties: {
    operation: { type: 'string' },
    a: { type: 'number' },
    b: { type: 'number' },
  },
  required: ['operation', 'a', 'b'],
};

export const calculatorTool = new Tool<CalculatorInput>({
  name: 'calculator',
  description: 'Perform basic math operations',
  version: '1.0.0',
  inputSchema: calculatorSchema,
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
            success: false,
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
          success: false,
          data: `Unknown operation: ${operation}`,
          error: {
            code: 'INVALID_OPERATION',
            message: `Operation ${operation} not supported`,
          },
        };
    }

    return {
      success: true,
      data: result.toString(),
    };
  },
}); 
