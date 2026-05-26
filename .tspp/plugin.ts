import { join } from 'node:path';
import type { BunPlugin } from 'bun';
import { autoImports } from 'bun-plugin-auto-imports';

export function createAutoImportPlugin(projectRoot: string): BunPlugin {
  return autoImports({
    imports: [{ name: 'None', from: '#tspp/types' }],
    dts: join(projectRoot, '.tspp', 'types.d.ts'),
  });
}
