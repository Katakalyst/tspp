export {};

type TypedNumber<T> = number & {
  readonly __kind__: T;
};

type BigTypedNumber<T> = bigint & {
  readonly __kind__: T;
};

declare global {
  type Some<T> = {
    readonly value: T;
  };
  type None = typeof None;
  type Option<T> = Some<T> | None;

  type Ok<T> = {
    readonly ok: true;
    readonly value: T;
  };
  type Err<E> = {
    readonly ok: false;
    readonly error: E;
  };
  type Result<T, E> = Ok<T> | Err<E>;

  const Some: <T>(value: T) => Some<T>;
  const None: unique symbol;
  const isNone: <T>(value: Option<T>) => value is None;
  const isSome: <T>(value: Option<T>) => value is Some<T>;

  const Ok: <T>(value: T) => Ok<T>;
  const Err: <E>(error: E) => Err<E>;
  const isOk: <T, E>(value: Result<T, E>) => value is Ok<T>;
  const isErr: <T, E>(value: Result<T, E>) => value is Err<E>;

  type i8 = TypedNumber<'i8'>;
  type u8 = TypedNumber<'u8'>;
  type i16 = TypedNumber<'i16'>;
  type u16 = TypedNumber<'u16'>;
  type i32 = TypedNumber<'i32'>;
  type u32 = TypedNumber<'u32'>;
  type i64 = BigTypedNumber<'i64'>;
  type u64 = BigTypedNumber<'u64'>;
  type i128 = BigTypedNumber<'i128'>;
  type u128 = BigTypedNumber<'u128'>;

  const i8: (value: number | bigint) => i8;
  const u8: (value: number | bigint) => u8;
  const i16: (value: number | bigint) => i16;
  const u16: (value: number | bigint) => u16;
  const i32: (value: number | bigint) => i32;
  const u32: (value: number | bigint) => u32;
  const i64: (value: number | bigint) => i64;
  const u64: (value: number | bigint) => u64;
  const i128: (value: number | bigint) => i128;
  const u128: (value: number | bigint) => u128;
}
