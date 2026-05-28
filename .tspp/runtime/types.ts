import { List as ImmutableList } from 'immutable';
import {
  i8 as createI8,
  i16 as createI16,
  i32 as createI32,
  i64 as createI64,
  i128 as createI128,
  u8 as createU8,
  u16 as createU16,
  u32 as createU32,
  u64 as createU64,
  u128 as createU128,
} from 'typed-numbers';

export const i8 = createI8;
export const u8 = createU8;
export const i16 = createI16;
export const u16 = createU16;
export const i32 = createI32;
export const u32 = createU32;
export const i64 = createI64;
export const u64 = createU64;
export const i128 = createI128;
export const u128 = createU128;
export type i8 = import('typed-numbers').i8;
export type u8 = import('typed-numbers').u8;
export type i16 = import('typed-numbers').i16;
export type u16 = import('typed-numbers').u16;
export type i32 = import('typed-numbers').i32;
export type u32 = import('typed-numbers').u32;
export type i64 = import('typed-numbers').i64;
export type u64 = import('typed-numbers').u64;
export type i128 = import('typed-numbers').i128;
export type u128 = import('typed-numbers').u128;

const listData = Symbol('List.data');
const fixedNumberWidths = {
  i8: 8n,
  u8: 8n,
  i16: 16n,
  u16: 16n,
  i32: 32n,
  u32: 32n,
  i64: 64n,
  u64: 64n,
  i128: 128n,
  u128: 128n,
} as const;

export type FixedNumberKind = keyof typeof fixedNumberWidths;
export type FixedNumber =
  | i8
  | u8
  | i16
  | u16
  | i32
  | u32
  | i64
  | u64
  | i128
  | u128;

function toBigInt(value: FixedNumber): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  return BigInt(value);
}

function castFixedNumber<T extends FixedNumber>(
  kind: FixedNumberKind,
  value: bigint,
): T {
  switch (kind) {
    case 'i8':
      return i8(value) as T;
    case 'u8':
      return u8(value) as T;
    case 'i16':
      return i16(value) as T;
    case 'u16':
      return u16(value) as T;
    case 'i32':
      return i32(value) as T;
    case 'u32':
      return u32(value) as T;
    case 'i64':
      return i64(value) as T;
    case 'u64':
      return u64(value) as T;
    case 'i128':
      return i128(value) as T;
    case 'u128':
      return u128(value) as T;
  }
}

function unsignedValue(kind: FixedNumberKind, value: FixedNumber): bigint {
  const width = fixedNumberWidths[kind];
  const mask = (1n << width) - 1n;

  return toBigInt(value) & mask;
}

export function __tsppNumberAdd<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) + toBigInt(right));
}

export function __tsppNumberSubtract<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) - toBigInt(right));
}

export function __tsppNumberMultiply<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) * toBigInt(right));
}

export function __tsppNumberExponentiate<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) ** toBigInt(right));
}

export function __tsppNumberDivide<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) / toBigInt(right));
}

export function __tsppNumberRemainder<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) % toBigInt(right));
}

export function __tsppNumberBitwiseAnd<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) & toBigInt(right));
}

export function __tsppNumberBitwiseOr<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) | toBigInt(right));
}

export function __tsppNumberBitwiseXor<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) ^ toBigInt(right));
}

export function __tsppNumberLeftShift<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) << toBigInt(right));
}

export function __tsppNumberRightShift<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, toBigInt(left) >> toBigInt(right));
}

export function __tsppNumberUnsignedRightShift<T extends FixedNumber>(
  kind: FixedNumberKind,
  left: T,
  right: T,
): T {
  return castFixedNumber(kind, unsignedValue(kind, left) >> toBigInt(right));
}

export function __tsppNumberPositive<T extends FixedNumber>(
  kind: FixedNumberKind,
  value: T,
): T {
  return castFixedNumber(kind, toBigInt(value));
}

export function __tsppNumberNegate<T extends FixedNumber>(
  kind: FixedNumberKind,
  value: T,
): T {
  return castFixedNumber(kind, -toBigInt(value));
}

export function __tsppNumberBitwiseNot<T extends FixedNumber>(
  kind: FixedNumberKind,
  value: T,
): T {
  return castFixedNumber(kind, ~toBigInt(value));
}

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

export type Iterator<T> = {
  readonly done: boolean;
  readonly value: Option<T>;
  next(): Iterator<T>;
};

export function toIterator<T>(
  value: Iterator<T> | { iter(): Iterator<T> },
): Iterator<T> {
  if ('iter' in value) {
    return value.iter();
  }

  return value;
}

function createListIterator<T>(
  list: ImmutableList<T>,
  index: number,
): Iterator<T> {
  if (index >= list.size) {
    const finished: Iterator<T> = {
      done: true,
      value: None,
      next: () => finished,
    };

    return finished;
  }

  return {
    done: false,
    value: Some(list.get(index) as T),
    next: () => createListIterator(list, index + 1),
  };
}

export type List<T> = {
  readonly [listData]: ImmutableList<T>;
  iter(): Iterator<T>;
  size(): number;
  at(index: number): Option<T>;
  push(...values: T[]): List<T>;
  pop(): Option<List<T>>;
  unshift(...values: T[]): List<T>;
  shift(): Option<List<T>>;
  insert(index: number, value: T): List<T>;
  delete(index: number): List<T>;
  remove(index: number): List<T>;
  slice(begin: number, end: number): List<T>;
  concat(...lists: List<T>[]): List<T>;
  clear(): List<T>;
  flat<U>(): List<U>;
  map<U>(fn: (value: T, index: number) => U): List<U>;
  filter(fn: (value: T, index: number) => boolean): List<T>;
  reverse(): List<T>;
  sort(): List<T>;
  findIndex(fn: (value: T, index: number) => boolean): Option<number>;
  some(fn: (value: T, index: number) => boolean): boolean;
  every(fn: (value: T, index: number) => boolean): boolean;
  join(): string;
};

function unwrapList<T>(list: List<T>): ImmutableList<T> {
  return list[listData];
}

function wrapList<T>(data: ImmutableList<T>): List<T> {
  return {
    [listData]: data,
    iter: () => createListIterator(data, 0),
    size: () => data.size,
    at: (index) => {
      if (!data.has(index)) {
        return None;
      }

      return Some(data.get(index) as T);
    },
    push: (...values) => wrapList(data.push(...values)),
    pop: () => {
      if (data.size === 0) {
        return None;
      }

      return Some(wrapList(data.pop()));
    },
    unshift: (...values) => wrapList(data.unshift(...values)),
    shift: () => {
      if (data.size === 0) {
        return None;
      }

      return Some(wrapList(data.shift()));
    },
    insert: (index, value) => wrapList(data.insert(index, value)),
    delete: (index) => wrapList(data.delete(index)),
    remove: (index) => wrapList(data.remove(index)),
    slice: (begin, end) => wrapList(data.slice(begin, end)),
    concat: (...lists) =>
      wrapList(data.concat(...lists.map((list) => unwrapList(list)))),
    clear: () => wrapList(data.clear()),
    flat: <U>() => {
      let flattened = ImmutableList<U>();

      data.forEach((value) => {
        flattened = flattened.concat(unwrapList(value as List<U>));
      });

      return wrapList(flattened);
    },
    map: <U>(fn: (value: T, index: number) => U) =>
      wrapList(
        data
          .map((value, index) => fn(value, index))
          .toList() as ImmutableList<U>,
      ),
    filter: (fn) =>
      wrapList(
        data
          .filter((value, index) => fn(value, index))
          .toList() as ImmutableList<T>,
      ),
    reverse: () => wrapList(data.reverse()),
    sort: () => wrapList(data.sort() as ImmutableList<T>),
    findIndex: (fn) => {
      const index = data.findIndex((value, currentIndex) =>
        fn(value, currentIndex),
      );

      if (index === -1) {
        return None;
      }

      return Some(index);
    },
    some: (fn) => data.some((value, index) => fn(value, index)),
    every: (fn) => data.every((value, index) => fn(value, index)),
    join: () => data.join(','),
  };
}

export const List = {
  of<T>(...values: T[]): List<T> {
    return wrapList(ImmutableList(values));
  },
};
