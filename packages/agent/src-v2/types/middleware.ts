export type MiddlewareBaseYieldValue = {
  type: `middleware.${string}`;
  [key: string]: unknown;
};

export type MiddlewareBaseNextValue = {
  type: `middleware.${string}`;
  [key: string]: unknown;
};
