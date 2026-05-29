export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
};

export function Ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export type Err<E> = {
  readonly ok: false;
  readonly error: E;
};

export function Err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export type Result<T, E> = Ok<T> | Err<E>;

export function isOk<T, E>(value: Result<T, E>): value is Ok<T> {
  return value.ok;
}

export function isErr<T, E>(value: Result<T, E>): value is Err<E> {
  return !value.ok;
}
