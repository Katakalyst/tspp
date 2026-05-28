import { pathToFileURL } from 'node:url';
import { plugin } from 'bun';
import { createPlugins } from '../compiler/plugin';
import { printError, resolveEntry, resolveProjectRoot } from './shared';

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
