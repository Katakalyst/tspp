import type { Option } from './option';

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
