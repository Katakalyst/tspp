export const __tsppNumberCellData = Symbol('NumberCell.data');

export type IntegerStorage =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array;

type NumberCell<TKind extends string, TValue, TStorage extends IntegerStorage> = {
  readonly __kind__: TKind;
  readonly [__tsppNumberCellData]: TStorage;
  read(): TValue;
  valueOf(): TValue;
  [Symbol.toPrimitive](): TValue;
};

function createNumberCell<
  TKind extends string,
  TValue,
  TStorage extends IntegerStorage,
>(
  kind: TKind,
  storage: TStorage,
): NumberCell<TKind, TValue, TStorage> {
  return {
    __kind__: kind,
    [__tsppNumberCellData]: storage,
    read() {
      return storage[0] as TValue;
    },
    valueOf() {
      return storage[0] as TValue;
    },
    [Symbol.toPrimitive]() {
      return storage[0] as TValue;
    },
  };
}

function assertValidNumberInput(value: number): void {
  if (Number.isNaN(value)) {
    throw new RangeError('Numeric types do not support NaN.');
  }

  if (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
    throw new RangeError('Numeric types do not support Infinity.');
  }
}

function createNumberConstructor<TKind extends string, TStorage extends IntegerStorage>(
  kind: TKind,
  createStorage: (value: number) => TStorage,
): (value: number) => NumberCell<TKind, number, TStorage> {
  return (value) => {
    assertValidNumberInput(value);
    return createNumberCell(kind, createStorage(value));
  };
}

function createBigIntConstructor<
  TKind extends string,
  TStorage extends BigInt64Array | BigUint64Array,
>(
  kind: TKind,
  createStorage: (value: bigint) => TStorage,
): (value: bigint) => NumberCell<TKind, bigint, TStorage> {
  return (value) => createNumberCell(kind, createStorage(value));
}

export type i8 = NumberCell<'i8', number, Int8Array>;
export type u8 = NumberCell<'u8', number, Uint8Array>;
export type i16 = NumberCell<'i16', number, Int16Array>;
export type u16 = NumberCell<'u16', number, Uint16Array>;
export type i32 = NumberCell<'i32', number, Int32Array>;
export type u32 = NumberCell<'u32', number, Uint32Array>;
export type i64 = NumberCell<'i64', bigint, BigInt64Array>;
export type u64 = NumberCell<'u64', bigint, BigUint64Array>;

export type SignedInteger = i8 | i16 | i32 | i64;
export type UnsignedInteger = u8 | u16 | u32 | u64;
export type ByteInteger = SignedInteger | UnsignedInteger;

export const i8 = createNumberConstructor('i8', (value) => Int8Array.of(value));
export const u8 = createNumberConstructor('u8', (value) => Uint8Array.of(value));
export const i16 = createNumberConstructor('i16', (value) => Int16Array.of(value));
export const u16 = createNumberConstructor('u16', (value) => Uint16Array.of(value));
export const i32 = createNumberConstructor('i32', (value) => Int32Array.of(value));
export const u32 = createNumberConstructor('u32', (value) => Uint32Array.of(value));
export const i64 = createBigIntConstructor('i64', (value) => BigInt64Array.of(value));
export const u64 = createBigIntConstructor('u64', (value) => BigUint64Array.of(value));

type NumberBackedInteger = i8 | u8 | i16 | u16 | i32 | u32;
type BigIntBackedInteger = i64 | u64;

function assertNonZeroNumber(value: number): void {
  if (value === 0) {
    throw new RangeError('Cannot divide by zero.');
  }
}

function assertNonZeroBigInt(value: bigint): void {
  if (value === 0n) {
    throw new RangeError('Cannot divide by zero.');
  }
}

function createNumberBinaryOperation<T extends NumberBackedInteger>(
  cast: (value: number) => T,
  operation: (left: number, right: number) => number,
): (left: T, right: T) => T {
  return (left, right) =>
    cast(
      operation(
        left[__tsppNumberCellData][0]!,
        right[__tsppNumberCellData][0]!,
      ),
    );
}

function createBigIntBinaryOperation<T extends BigIntBackedInteger>(
  cast: (value: bigint) => T,
  operation: (left: bigint, right: bigint) => bigint,
): (left: T, right: T) => T {
  return (left, right) =>
    cast(
      operation(
        left[__tsppNumberCellData][0]!,
        right[__tsppNumberCellData][0]!,
      ),
    );
}

function createNumberUnaryOperation<T extends NumberBackedInteger>(
  cast: (value: number) => T,
  operation: (value: number) => number,
): (value: T) => T {
  return (value) => cast(operation(value[__tsppNumberCellData][0]!));
}

function createBigIntUnaryOperation<T extends BigIntBackedInteger>(
  cast: (value: bigint) => T,
  operation: (value: bigint) => bigint,
): (value: T) => T {
  return (value) => cast(operation(value[__tsppNumberCellData][0]!));
}

function createNumberDivisionOperation<T extends NumberBackedInteger>(
  cast: (value: number) => T,
): (left: T, right: T) => T {
  return createNumberBinaryOperation(cast, (left, right) => {
    assertNonZeroNumber(right);
    return left / right;
  });
}

function createBigIntDivisionOperation<T extends BigIntBackedInteger>(
  cast: (value: bigint) => T,
): (left: T, right: T) => T {
  return createBigIntBinaryOperation(cast, (left, right) => {
    assertNonZeroBigInt(right);
    return left / right;
  });
}

function createNumberRemainderOperation<T extends NumberBackedInteger>(
  cast: (value: number) => T,
): (left: T, right: T) => T {
  return createNumberBinaryOperation(cast, (left, right) => {
    assertNonZeroNumber(right);
    return left % right;
  });
}

function createBigIntRemainderOperation<T extends BigIntBackedInteger>(
  cast: (value: bigint) => T,
): (left: T, right: T) => T {
  return createBigIntBinaryOperation(cast, (left, right) => {
    assertNonZeroBigInt(right);
    return left % right;
  });
}

function createNumberComparisonOperation<T extends NumberBackedInteger>(
  operation: (left: number, right: number) => boolean,
): (left: T, right: T) => boolean {
  return (left, right) =>
    operation(
      left[__tsppNumberCellData][0]!,
      right[__tsppNumberCellData][0]!,
    );
}

function createBigIntComparisonOperation<T extends BigIntBackedInteger>(
  operation: (left: bigint, right: bigint) => boolean,
): (left: T, right: T) => boolean {
  return (left, right) =>
    operation(
      left[__tsppNumberCellData][0]!,
      right[__tsppNumberCellData][0]!,
    );
}

function createNumberBitwiseOperation<T extends NumberBackedInteger>(
  cast: (value: number) => T,
  operation: (left: number, right: number) => number,
): (left: T, right: T) => T {
  return createNumberBinaryOperation(cast, operation);
}

function createBigIntBitwiseOperation<T extends BigIntBackedInteger>(
  cast: (value: bigint) => T,
  operation: (left: bigint, right: bigint) => bigint,
): (left: T, right: T) => T {
  return createBigIntBinaryOperation(cast, operation);
}

export const __tsppI8Add = createNumberBinaryOperation(i8, (left, right) => left + right);
export const __tsppI8Subtract = createNumberBinaryOperation(i8, (left, right) => left - right);
export const __tsppI8Multiply = createNumberBinaryOperation(i8, (left, right) => left * right);
export const __tsppI8Divide = createNumberDivisionOperation(i8);
export const __tsppI8Remainder = createNumberRemainderOperation(i8);
export const __tsppI8BitwiseAnd = createNumberBitwiseOperation(i8, (left, right) => left & right);
export const __tsppI8BitwiseOr = createNumberBitwiseOperation(i8, (left, right) => left | right);
export const __tsppI8BitwiseXor = createNumberBitwiseOperation(i8, (left, right) => left ^ right);
export const __tsppI8LeftShift = createNumberBitwiseOperation(i8, (left, right) => left << right);
export const __tsppI8RightShift = createNumberBitwiseOperation(i8, (left, right) => left >> right);
export const __tsppI8LessThan = createNumberComparisonOperation<i8>((left, right) => left < right);
export const __tsppI8LessThanOrEqual = createNumberComparisonOperation<i8>((left, right) => left <= right);
export const __tsppI8GreaterThan = createNumberComparisonOperation<i8>((left, right) => left > right);
export const __tsppI8GreaterThanOrEqual = createNumberComparisonOperation<i8>((left, right) => left >= right);
export const __tsppI8Equal = createNumberComparisonOperation<i8>((left, right) => left === right);
export const __tsppI8NotEqual = createNumberComparisonOperation<i8>((left, right) => left !== right);
export const __tsppI8BitwiseNot = createNumberUnaryOperation(i8, (value) => ~value);
export const __tsppI8Positive = createNumberUnaryOperation(i8, (value) => value);
export const __tsppI8Negate = createNumberUnaryOperation(i8, (value) => -value);

export const __tsppU8Add = createNumberBinaryOperation(u8, (left, right) => left + right);
export const __tsppU8Subtract = createNumberBinaryOperation(u8, (left, right) => left - right);
export const __tsppU8Multiply = createNumberBinaryOperation(u8, (left, right) => left * right);
export const __tsppU8Divide = createNumberDivisionOperation(u8);
export const __tsppU8Remainder = createNumberRemainderOperation(u8);
export const __tsppU8BitwiseAnd = createNumberBitwiseOperation(u8, (left, right) => left & right);
export const __tsppU8BitwiseOr = createNumberBitwiseOperation(u8, (left, right) => left | right);
export const __tsppU8BitwiseXor = createNumberBitwiseOperation(u8, (left, right) => left ^ right);
export const __tsppU8LeftShift = createNumberBitwiseOperation(u8, (left, right) => left << right);
export const __tsppU8RightShift = createNumberBitwiseOperation(u8, (left, right) => left >> right);
export const __tsppU8LessThan = createNumberComparisonOperation<u8>((left, right) => left < right);
export const __tsppU8LessThanOrEqual = createNumberComparisonOperation<u8>((left, right) => left <= right);
export const __tsppU8GreaterThan = createNumberComparisonOperation<u8>((left, right) => left > right);
export const __tsppU8GreaterThanOrEqual = createNumberComparisonOperation<u8>((left, right) => left >= right);
export const __tsppU8Equal = createNumberComparisonOperation<u8>((left, right) => left === right);
export const __tsppU8NotEqual = createNumberComparisonOperation<u8>((left, right) => left !== right);
export const __tsppU8BitwiseNot = createNumberUnaryOperation(u8, (value) => ~value);
export const __tsppU8Positive = createNumberUnaryOperation(u8, (value) => value);
export const __tsppU8Negate = createNumberUnaryOperation(u8, (value) => -value);

export const __tsppI16Add = createNumberBinaryOperation(i16, (left, right) => left + right);
export const __tsppI16Subtract = createNumberBinaryOperation(i16, (left, right) => left - right);
export const __tsppI16Multiply = createNumberBinaryOperation(i16, (left, right) => left * right);
export const __tsppI16Divide = createNumberDivisionOperation(i16);
export const __tsppI16Remainder = createNumberRemainderOperation(i16);
export const __tsppI16BitwiseAnd = createNumberBitwiseOperation(i16, (left, right) => left & right);
export const __tsppI16BitwiseOr = createNumberBitwiseOperation(i16, (left, right) => left | right);
export const __tsppI16BitwiseXor = createNumberBitwiseOperation(i16, (left, right) => left ^ right);
export const __tsppI16LeftShift = createNumberBitwiseOperation(i16, (left, right) => left << right);
export const __tsppI16RightShift = createNumberBitwiseOperation(i16, (left, right) => left >> right);
export const __tsppI16LessThan = createNumberComparisonOperation<i16>((left, right) => left < right);
export const __tsppI16LessThanOrEqual = createNumberComparisonOperation<i16>((left, right) => left <= right);
export const __tsppI16GreaterThan = createNumberComparisonOperation<i16>((left, right) => left > right);
export const __tsppI16GreaterThanOrEqual = createNumberComparisonOperation<i16>((left, right) => left >= right);
export const __tsppI16Equal = createNumberComparisonOperation<i16>((left, right) => left === right);
export const __tsppI16NotEqual = createNumberComparisonOperation<i16>((left, right) => left !== right);
export const __tsppI16BitwiseNot = createNumberUnaryOperation(i16, (value) => ~value);
export const __tsppI16Positive = createNumberUnaryOperation(i16, (value) => value);
export const __tsppI16Negate = createNumberUnaryOperation(i16, (value) => -value);

export const __tsppU16Add = createNumberBinaryOperation(u16, (left, right) => left + right);
export const __tsppU16Subtract = createNumberBinaryOperation(u16, (left, right) => left - right);
export const __tsppU16Multiply = createNumberBinaryOperation(u16, (left, right) => left * right);
export const __tsppU16Divide = createNumberDivisionOperation(u16);
export const __tsppU16Remainder = createNumberRemainderOperation(u16);
export const __tsppU16BitwiseAnd = createNumberBitwiseOperation(u16, (left, right) => left & right);
export const __tsppU16BitwiseOr = createNumberBitwiseOperation(u16, (left, right) => left | right);
export const __tsppU16BitwiseXor = createNumberBitwiseOperation(u16, (left, right) => left ^ right);
export const __tsppU16LeftShift = createNumberBitwiseOperation(u16, (left, right) => left << right);
export const __tsppU16RightShift = createNumberBitwiseOperation(u16, (left, right) => left >> right);
export const __tsppU16LessThan = createNumberComparisonOperation<u16>((left, right) => left < right);
export const __tsppU16LessThanOrEqual = createNumberComparisonOperation<u16>((left, right) => left <= right);
export const __tsppU16GreaterThan = createNumberComparisonOperation<u16>((left, right) => left > right);
export const __tsppU16GreaterThanOrEqual = createNumberComparisonOperation<u16>((left, right) => left >= right);
export const __tsppU16Equal = createNumberComparisonOperation<u16>((left, right) => left === right);
export const __tsppU16NotEqual = createNumberComparisonOperation<u16>((left, right) => left !== right);
export const __tsppU16BitwiseNot = createNumberUnaryOperation(u16, (value) => ~value);
export const __tsppU16Positive = createNumberUnaryOperation(u16, (value) => value);
export const __tsppU16Negate = createNumberUnaryOperation(u16, (value) => -value);

export const __tsppI32Add = createNumberBinaryOperation(i32, (left, right) => left + right);
export const __tsppI32Subtract = createNumberBinaryOperation(i32, (left, right) => left - right);
export const __tsppI32Multiply = createNumberBinaryOperation(i32, (left, right) => left * right);
export const __tsppI32Divide = createNumberDivisionOperation(i32);
export const __tsppI32Remainder = createNumberRemainderOperation(i32);
export const __tsppI32BitwiseAnd = createNumberBitwiseOperation(i32, (left, right) => left & right);
export const __tsppI32BitwiseOr = createNumberBitwiseOperation(i32, (left, right) => left | right);
export const __tsppI32BitwiseXor = createNumberBitwiseOperation(i32, (left, right) => left ^ right);
export const __tsppI32LeftShift = createNumberBitwiseOperation(i32, (left, right) => left << right);
export const __tsppI32RightShift = createNumberBitwiseOperation(i32, (left, right) => left >> right);
export const __tsppI32LessThan = createNumberComparisonOperation<i32>((left, right) => left < right);
export const __tsppI32LessThanOrEqual = createNumberComparisonOperation<i32>((left, right) => left <= right);
export const __tsppI32GreaterThan = createNumberComparisonOperation<i32>((left, right) => left > right);
export const __tsppI32GreaterThanOrEqual = createNumberComparisonOperation<i32>((left, right) => left >= right);
export const __tsppI32Equal = createNumberComparisonOperation<i32>((left, right) => left === right);
export const __tsppI32NotEqual = createNumberComparisonOperation<i32>((left, right) => left !== right);
export const __tsppI32BitwiseNot = createNumberUnaryOperation(i32, (value) => ~value);
export const __tsppI32Positive = createNumberUnaryOperation(i32, (value) => value);
export const __tsppI32Negate = createNumberUnaryOperation(i32, (value) => -value);

export const __tsppU32Add = createNumberBinaryOperation(u32, (left, right) => left + right);
export const __tsppU32Subtract = createNumberBinaryOperation(u32, (left, right) => left - right);
export const __tsppU32Multiply = createNumberBinaryOperation(u32, (left, right) => left * right);
export const __tsppU32Divide = createNumberDivisionOperation(u32);
export const __tsppU32Remainder = createNumberRemainderOperation(u32);
export const __tsppU32BitwiseAnd = createNumberBitwiseOperation(u32, (left, right) => left & right);
export const __tsppU32BitwiseOr = createNumberBitwiseOperation(u32, (left, right) => left | right);
export const __tsppU32BitwiseXor = createNumberBitwiseOperation(u32, (left, right) => left ^ right);
export const __tsppU32LeftShift = createNumberBitwiseOperation(u32, (left, right) => left << right);
export const __tsppU32RightShift = createNumberBitwiseOperation(u32, (left, right) => left >> right);
export const __tsppU32LessThan = createNumberComparisonOperation<u32>((left, right) => left < right);
export const __tsppU32LessThanOrEqual = createNumberComparisonOperation<u32>((left, right) => left <= right);
export const __tsppU32GreaterThan = createNumberComparisonOperation<u32>((left, right) => left > right);
export const __tsppU32GreaterThanOrEqual = createNumberComparisonOperation<u32>((left, right) => left >= right);
export const __tsppU32Equal = createNumberComparisonOperation<u32>((left, right) => left === right);
export const __tsppU32NotEqual = createNumberComparisonOperation<u32>((left, right) => left !== right);
export const __tsppU32BitwiseNot = createNumberUnaryOperation(u32, (value) => ~value);
export const __tsppU32Positive = createNumberUnaryOperation(u32, (value) => value);
export const __tsppU32Negate = createNumberUnaryOperation(u32, (value) => -value);

export const __tsppI64Add = createBigIntBinaryOperation(i64, (left, right) => left + right);
export const __tsppI64Subtract = createBigIntBinaryOperation(i64, (left, right) => left - right);
export const __tsppI64Multiply = createBigIntBinaryOperation(i64, (left, right) => left * right);
export const __tsppI64Divide = createBigIntDivisionOperation(i64);
export const __tsppI64Remainder = createBigIntRemainderOperation(i64);
export const __tsppI64BitwiseAnd = createBigIntBitwiseOperation(i64, (left, right) => left & right);
export const __tsppI64BitwiseOr = createBigIntBitwiseOperation(i64, (left, right) => left | right);
export const __tsppI64BitwiseXor = createBigIntBitwiseOperation(i64, (left, right) => left ^ right);
export const __tsppI64LeftShift = createBigIntBitwiseOperation(i64, (left, right) => left << right);
export const __tsppI64RightShift = createBigIntBitwiseOperation(i64, (left, right) => left >> right);
export const __tsppI64LessThan = createBigIntComparisonOperation<i64>((left, right) => left < right);
export const __tsppI64LessThanOrEqual = createBigIntComparisonOperation<i64>((left, right) => left <= right);
export const __tsppI64GreaterThan = createBigIntComparisonOperation<i64>((left, right) => left > right);
export const __tsppI64GreaterThanOrEqual = createBigIntComparisonOperation<i64>((left, right) => left >= right);
export const __tsppI64Equal = createBigIntComparisonOperation<i64>((left, right) => left === right);
export const __tsppI64NotEqual = createBigIntComparisonOperation<i64>((left, right) => left !== right);
export const __tsppI64BitwiseNot = createBigIntUnaryOperation(i64, (value) => ~value);
export const __tsppI64Positive = createBigIntUnaryOperation(i64, (value) => value);
export const __tsppI64Negate = createBigIntUnaryOperation(i64, (value) => -value);

export const __tsppU64Add = createBigIntBinaryOperation(u64, (left, right) => left + right);
export const __tsppU64Subtract = createBigIntBinaryOperation(u64, (left, right) => left - right);
export const __tsppU64Multiply = createBigIntBinaryOperation(u64, (left, right) => left * right);
export const __tsppU64Divide = createBigIntDivisionOperation(u64);
export const __tsppU64Remainder = createBigIntRemainderOperation(u64);
export const __tsppU64BitwiseAnd = createBigIntBitwiseOperation(u64, (left, right) => left & right);
export const __tsppU64BitwiseOr = createBigIntBitwiseOperation(u64, (left, right) => left | right);
export const __tsppU64BitwiseXor = createBigIntBitwiseOperation(u64, (left, right) => left ^ right);
export const __tsppU64LeftShift = createBigIntBitwiseOperation(u64, (left, right) => left << right);
export const __tsppU64RightShift = createBigIntBitwiseOperation(u64, (left, right) => left >> right);
export const __tsppU64LessThan = createBigIntComparisonOperation<u64>((left, right) => left < right);
export const __tsppU64LessThanOrEqual = createBigIntComparisonOperation<u64>((left, right) => left <= right);
export const __tsppU64GreaterThan = createBigIntComparisonOperation<u64>((left, right) => left > right);
export const __tsppU64GreaterThanOrEqual = createBigIntComparisonOperation<u64>((left, right) => left >= right);
export const __tsppU64Equal = createBigIntComparisonOperation<u64>((left, right) => left === right);
export const __tsppU64NotEqual = createBigIntComparisonOperation<u64>((left, right) => left !== right);
export const __tsppU64BitwiseNot = createBigIntUnaryOperation(u64, (value) => ~value);
export const __tsppU64Positive = createBigIntUnaryOperation(u64, (value) => value);
export const __tsppU64Negate = createBigIntUnaryOperation(u64, (value) => -value);
