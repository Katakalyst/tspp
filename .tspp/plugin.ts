import { join } from 'node:path';
import type { BunPlugin } from 'bun';
import { autoImports } from 'bun-plugin-auto-imports';
import { createTsppTransformPlugin } from './transform.ts';

export function createPlugins(projectRoot: string): BunPlugin[] {
  return [
    createTsppTransformPlugin(projectRoot),
    autoImports({
      imports: [
        { name: 'Err', from: '#tspp/types' },
        { name: 'None', from: '#tspp/types' },
        { name: 'Ok', from: '#tspp/types' },
        { name: 'Some', from: '#tspp/types' },
        { name: 'isErr', from: '#tspp/types' },
        { name: 'isNone', from: '#tspp/types' },
        { name: 'isOk', from: '#tspp/types' },
        { name: 'isSome', from: '#tspp/types' },
      ],
      dts: join(projectRoot, '.tspp', 'types.d.ts'),
    }),
  ];
}
