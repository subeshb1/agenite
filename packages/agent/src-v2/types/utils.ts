/**
 * Intersect the two types and union the common properties.
 * Example:
 * type A = { a: string; b: number };
 * type B = { b: string; c: boolean };
 * type C = IntersectButUnionCommonProps<A, B>;
 * // C is { a: string; b: string | number; c: boolean }
 */
export type IntersectButUnionCommonProps<T, U> = {
  [K in keyof T | keyof U]: K extends keyof T
    ? K extends keyof U
      ? T[K] | U[K] // If the key exists in both, create a union
      : T[K] // If the key exists only in T, use T's type
    : K extends keyof U
      ? U[K] // If the key exists only in U, use U's type
      : never;
};

/**
 * If the type is never, return the first value.
 * If the type is unknown or any, return the second value.
 * Otherwise, return the third value.
 */
export type IfNeverOrIfAny<T, NeverValue, AnyValue, ElseValue> = [T] extends [
  never,
]
  ? NeverValue
  : [unknown] extends [T]
    ? AnyValue
    : ElseValue;
