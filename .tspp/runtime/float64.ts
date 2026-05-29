type Float64Cell = {
  readonly __kind__: 'float64';
  read(): number;
  valueOf(): number;
  [Symbol.toPrimitive](): number;
};

const float64Storage = new WeakMap<Float64Cell, number>();

function assertValidFloat64(value: number): void {
  if (Number.isNaN(value)) {
    throw new RangeError('float64 does not support NaN.');
  }

  if (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
    throw new RangeError('float64 does not support Infinity.');
  }
}

function createFloat64Cell(value: number): Float64Cell {
  assertValidFloat64(value);

  const cell: Float64Cell = {
    __kind__: 'float64',
    read() {
      return float64Storage.get(cell) ?? 0;
    },
    valueOf() {
      return float64Storage.get(cell) ?? 0;
    },
    [Symbol.toPrimitive]() {
      return float64Storage.get(cell) ?? 0;
    },
  };

  float64Storage.set(cell, value);
  return cell;
}

export type float64 = Float64Cell;

export function float64(value: number): float64 {
  return createFloat64Cell(value);
}

function createFloat64BinaryOperation(
  operation: (left: number, right: number) => number,
): (left: float64, right: float64) => float64 {
  return (left, right) => {
    const leftValue = left.valueOf();
    const rightValue = right.valueOf();
    const result = operation(leftValue, rightValue);
    assertValidFloat64(result);
    return float64(result);
  };
}

function createFloat64ComparisonOperation(
  operation: (left: number, right: number) => boolean,
): (left: float64, right: float64) => boolean {
  return (left, right) => operation(left.valueOf(), right.valueOf());
}

function createFloat64UnaryOperation(
  operation: (value: number) => number,
): (value: float64) => float64 {
  return (value) => {
    const result = operation(value.valueOf());
    assertValidFloat64(result);
    return float64(result);
  };
}

export const __tsppFloat64Add = createFloat64BinaryOperation((left, right) => left + right);
export const __tsppFloat64Subtract = createFloat64BinaryOperation((left, right) => left - right);
export const __tsppFloat64Multiply = (left: float64, right: float64): float64 => {
  const leftValue = left.valueOf();
  const rightValue = right.valueOf();
  const result = leftValue * rightValue;
  assertValidFloat64(result);
  return float64(result);
};
export const __tsppFloat64Divide = (left: float64, right: float64): float64 => {
  const leftValue = left.valueOf();
  const rightValue = right.valueOf();
  if (rightValue === 0) {
    throw new RangeError('Cannot divide by zero.');
  }
  const result = leftValue / rightValue;
  assertValidFloat64(result);
  return float64(result);
};
export const __tsppFloat64Remainder = (left: float64, right: float64): float64 => {
  const leftValue = left.valueOf();
  const rightValue = right.valueOf();
  if (rightValue === 0) {
    throw new RangeError('Cannot divide by zero.');
  }
  const result = leftValue % rightValue;
  assertValidFloat64(result);
  return float64(result);
};
export const __tsppFloat64Positive = createFloat64UnaryOperation((value) => value);
export const __tsppFloat64Negate = createFloat64UnaryOperation((value) => -value);
export const __tsppFloat64LessThan = createFloat64ComparisonOperation((left, right) => left < right);
export const __tsppFloat64LessThanOrEqual = createFloat64ComparisonOperation((left, right) => left <= right);
export const __tsppFloat64GreaterThan = createFloat64ComparisonOperation((left, right) => left > right);
export const __tsppFloat64GreaterThanOrEqual = createFloat64ComparisonOperation((left, right) => left >= right);
export const __tsppFloat64Equal = createFloat64ComparisonOperation((left, right) => left === right);
export const __tsppFloat64NotEqual = createFloat64ComparisonOperation((left, right) => left !== right);
