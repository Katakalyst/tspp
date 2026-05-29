export {};

declare const __tsppI8Brand: unique symbol;
declare const __tsppU8Brand: unique symbol;
declare const __tsppI16Brand: unique symbol;
declare const __tsppU16Brand: unique symbol;
declare const __tsppI32Brand: unique symbol;
declare const __tsppU32Brand: unique symbol;
declare const __tsppI64Brand: unique symbol;
declare const __tsppU64Brand: unique symbol;
declare const __tsppFloat64Brand: unique symbol;

declare global {
  type i8 = number & { readonly [__tsppI8Brand]: 'i8' };
  type u8 = number & { readonly [__tsppU8Brand]: 'u8' };
  type i16 = number & { readonly [__tsppI16Brand]: 'i16' };
  type u16 = number & { readonly [__tsppU16Brand]: 'u16' };
  type i32 = number & { readonly [__tsppI32Brand]: 'i32' };
  type u32 = number & { readonly [__tsppU32Brand]: 'u32' };
  type i64 = bigint & { readonly [__tsppI64Brand]: 'i64' };
  type u64 = bigint & { readonly [__tsppU64Brand]: 'u64' };
  type float64 = number & { readonly [__tsppFloat64Brand]: 'float64' };

  const i8: (value: number) => i8;
  const u8: (value: number) => u8;
  const i16: (value: number) => i16;
  const u16: (value: number) => u16;
  const i32: (value: number) => i32;
  const u32: (value: number) => u32;
  const i64: (value: bigint) => i64;
  const u64: (value: bigint) => u64;
  const float64: (value: number) => float64;
}
