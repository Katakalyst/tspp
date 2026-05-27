import { resolve } from 'node:path';
import type { BunPlugin } from 'bun';

const TRANSFORM_HELPER = resolve(import.meta.dir, 'transform-helper.cjs');

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createUserlandFilter(projectRoot: string): RegExp {
  const rootPattern = escapeRegex(resolve(projectRoot)).replaceAll(
    '\\\\',
    '\\\\',
  );

  return new RegExp(
    `^${rootPattern}\\\\(?!(?:\\.tspp|dist|node_modules)\\\\).+\\.ts$`,
    'i',
  );
}

function runTransform(filePath: string): string {
  const result = Bun.spawnSync({
    cmd: ['node', TRANSFORM_HELPER, filePath],
    stderr: 'pipe',
    stdout: 'pipe',
  });

  if (result.exitCode !== 0) {
    const error = new Error(
      result.stderr.length > 0
        ? new TextDecoder().decode(result.stderr)
        : `Transform failed for ${filePath}.`,
    );

    throw error;
  }

  return new TextDecoder().decode(result.stdout);
}

export function createTsppTransformPlugin(projectRoot: string): BunPlugin {
  return {
    name: 'tspp-transform',
    setup(build) {
      build.onLoad(
        { filter: createUserlandFilter(projectRoot) },
        async (args) => {
          return {
            contents: runTransform(args.path),
            loader: 'ts',
          };
        },
      );
    },
  };
}
