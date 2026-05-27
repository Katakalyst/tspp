import { pathToFileURL } from 'node:url';
import { plugin } from 'bun';
import { createPlugins } from './plugin.ts';
import { printError, resolveEntry, resolveProjectRoot } from './shared.ts';

async function main() {
  try {
    const projectRoot = resolveProjectRoot();
    const entry = resolveEntry(projectRoot);

    for (const currentPlugin of createPlugins(projectRoot)) {
      plugin(currentPlugin);
    }
    await import(pathToFileURL(entry).href);
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}

await main();
