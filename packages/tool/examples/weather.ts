import { Tool } from '../src';

interface WeatherInput {
  city: string;
  units?: 'metric' | 'imperial';
}

// Simulate API client
class WeatherAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWeather(city: string, units: string): Promise<string> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return `Temperature in ${city}: 22°${units === 'metric' ? 'C' : 'F'}`;
  }
}

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
      const { city, units = 'metric' } = input;

      try {
        const weather = await client.getWeather(city, units);
        return {
          success: true,
          data: weather,
        };
      } catch (error) {
        return {
          success: false,
          data: `Failed to get weather: ${error}`,
          error: {
            code: 'WEATHER_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  });
}; 
