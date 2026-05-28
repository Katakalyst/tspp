import { createPlugins } from '../compiler/plugin';
import {
  printError,
  resolveEntry,
  resolveOutdir,
  resolveProjectRoot,
} from './shared';

async function main() {
  try {
    const projectRoot = resolveProjectRoot();
    const entry = resolveEntry(projectRoot);
    const outdir = resolveOutdir(Bun.argv.slice(2));

    const result = await Bun.build({
      entrypoints: [entry],
      outdir,
      target: 'bun',
      format: 'esm',
      plugins: createPlugins(projectRoot),
    });

    if (!result.success) {
      throw new AggregateError(result.logs, 'Build failed');
    }

    console.log(`Built ${entry}`);
    console.log(`Output: ${outdir}`);
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}

await main();
