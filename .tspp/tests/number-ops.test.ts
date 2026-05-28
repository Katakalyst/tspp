import { expect, test } from 'bun:test';
import { type SpawnSyncReturns, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function transform(source: string): SpawnSyncReturns<string> {
  const directory = mkdtempSync(join(tmpdir(), 'tspp-number-'));
  const filePath = join(directory, 'probe.ts');

  try {
    writeFileSync(filePath, source);

    return spawnSync(
      'bun',
      ['.tspp/compiler/transform-helper.ts', filePath, projectRoot],
      {
        cwd: projectRoot,
        encoding: 'utf8',
      },
    );
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

test('transform lowers same-kind fixed-width operations', () => {
  const result = transform(`
    const a = u8(255) + u8(1);
    const b = i64(9223372036854775807n) + i64(1n);
  `);

  expect(result.status).toBe(0);
  expect(result.stdout).toContain('__tsppNumberAdd("u8", u8(255), u8(1))');
  expect(result.stdout).toContain(
    '__tsppNumberAdd("i64", i64(9223372036854775807n), i64(1n))',
  );
});

test('transform uses fixed-width annotations to construct literal initializers', () => {
  const result = transform(`
    const a: u8 = 12;
    const b: i16 = -12;
    const c: u64 = 12;
    const d: i64 = -12;
    const e: i128 = +12;
  `);

  expect(result.status).toBe(0);
  expect(result.stdout).toContain('const a: u8 = u8(12);');
  expect(result.stdout).toContain('const b: i16 = i16(-12);');
  expect(result.stdout).toContain('const c: u64 = u64(12n);');
  expect(result.stdout).toContain('const d: i64 = i64(-12n);');
  expect(result.stdout).toContain('const e: i128 = i128(12n);');
});

test('transform rejects bare numeric variable storage', () => {
  const inferred = transform('let value = 4;');
  const assigned = transform(`
    let value = u8(4);
    value = 5;
  `);

  expect(inferred.status).toBe(1);
  expect(assigned.status).toBe(1);
  expect(inferred.stderr).toContain(
    'Numeric variable initializers require a fixed-width annotation or constructor',
  );
  expect(assigned.stderr).toContain(
    'Numeric assignments require a fixed-width constructor',
  );
});

test('transform rejects negative unsigned fixed-width numbers', () => {
  const annotated = transform('const value: u8 = -1;');
  const constructed = transform('const value = u64(-1);');
  const expression = transform(`
    const other = u16(1);
    const value = u16(-other);
  `);

  expect(annotated.status).toBe(1);
  expect(constructed.status).toBe(1);
  expect(expression.status).toBe(1);
  expect(annotated.stderr).toContain(
    'Unsigned fixed-width numbers cannot be initialized with negative values',
  );
  expect(constructed.stderr).toContain(
    'Unsigned fixed-width numbers cannot be initialized with negative values',
  );
  expect(expression.stderr).toContain(
    'Unsigned fixed-width numbers cannot be initialized with negative values',
  );
});

test('transform rejects mixed or plain fixed-width operations', () => {
  const mixed = transform('const value = u8(1) + u16(2);');
  const plain = transform('const value = u8(1) + 1;');

  expect(mixed.status).toBe(1);
  expect(plain.status).toBe(1);
  expect(mixed.stderr).toContain(
    'Fixed-width number operations require matching operands',
  );
  expect(plain.stderr).toContain(
    'Fixed-width number operations require matching operands',
  );
});
