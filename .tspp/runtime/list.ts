import { List as ImmutableList } from 'immutable';
import { None, Some, type Option } from './option';
import type { Iterator } from './iterator';

const listData = Symbol('List.data');

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
