import { join } from 'node:path';
import type { BunPlugin } from 'bun';
import { autoImports } from 'bun-plugin-auto-imports';
import { createTsppTransformPlugin } from './transform';

export function createPlugins(projectRoot: string): BunPlugin[] {
  return [
    createTsppTransformPlugin(projectRoot),
    autoImports({
      imports: [
        { name: 'Err', from: '#tspp/types' },
        { name: 'None', from: '#tspp/types' },
        { name: 'Ok', from: '#tspp/types' },
        { name: 'Some', from: '#tspp/types' },
        { name: 'float64', from: '#tspp/types' },
        { name: 'i8', from: '#tspp/types' },
        { name: 'i16', from: '#tspp/types' },
        { name: 'i32', from: '#tspp/types' },
        { name: 'i64', from: '#tspp/types' },
        { name: 'isErr', from: '#tspp/types' },
        { name: 'isNone', from: '#tspp/types' },
        { name: 'isOk', from: '#tspp/types' },
        { name: 'isSome', from: '#tspp/types' },
        { name: 'u8', from: '#tspp/types' },
        { name: 'u16', from: '#tspp/types' },
        { name: 'u32', from: '#tspp/types' },
        { name: 'u64', from: '#tspp/types' },
      ],
      dts: join(projectRoot, '.tspp-cache', 'auto-imports.d.ts'),
    }),
  ];
}
