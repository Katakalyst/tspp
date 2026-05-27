import { List as ImmutableList } from 'immutable';

const listData = Symbol('List.data');

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
