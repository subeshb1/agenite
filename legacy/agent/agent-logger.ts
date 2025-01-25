import { Logger } from './types';

export function createAgentLogger(
  baseLogger: Logger,
  agentName: string,
): Logger {
  const prefix = `[${agentName}]`;

  return {
    info: (message: string, context?: Record<string, unknown>) =>
      baseLogger.info(`${prefix} ${message}`, context),

    error: (message: string, error: Error, context?: Record<string, unknown>) =>
      baseLogger.error(`${prefix} ${message}`, error, context),

    warn: (message: string, context?: Record<string, unknown>) =>
      baseLogger.warn(`${prefix} ${message}`, context),

    debug: (message: string, context?: Record<string, unknown>) =>
      baseLogger.debug(`${prefix} ${message}`, context),
  };
}
