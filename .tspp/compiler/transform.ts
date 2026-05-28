import { sep } from 'node:path';
import type { BunPlugin } from 'bun';

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createUserlandFilter(projectRoot: string): RegExp {
  const rootPattern = escapeRegex(projectRoot).replaceAll(
    escapeRegex(sep),
    '[\\\\/]',
  );

  return new RegExp(
    `^${rootPattern}[\\\\/](?!(?:\\.tspp|dist|node_modules)[\\\\/]).+\\.ts$`,
    'i',
  );
}

function runTransform(filePath: string, projectRoot: string): string {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      '.tspp/compiler/transform-helper.ts',
      filePath,
      projectRoot,
    ],
    cwd: projectRoot,
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
            contents: runTransform(args.path, projectRoot),
            loader: 'ts',
          };
        },
      );
    },
  };
}
