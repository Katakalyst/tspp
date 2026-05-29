export type Some<T> = {
  readonly value: T;
};

export function Some<T>(value: T): Some<T> {
  return { value };
}

export const None: unique symbol = Symbol('None');
export type None = typeof None;

export type Option<T> = Some<T> | None;

export function isNone<T>(value: Option<T>): value is None {
  return value === None;
}

export function isSome<T>(value: Option<T>): value is Some<T> {
  return value !== None;
}
