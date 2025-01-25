export interface JSONSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  [key: string]: unknown;
}
