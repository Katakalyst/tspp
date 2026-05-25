import type { BunPlugin } from "bun";
import { autoImports } from "bun-plugin-auto-imports";
import { join } from "node:path";

export function createAutoImportPlugin(projectRoot: string): BunPlugin {
  return autoImports({
    // Placeholder until tspp ships its own built-in runtime helpers.
    imports: [],
    dts: join(projectRoot, ".tspp", "auto-imports.d.ts"),
  });
}
