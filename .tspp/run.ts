import { plugin } from "bun";
import { pathToFileURL } from "node:url";
import { createAutoImportPlugin } from "./plugin.ts";
import { printError, resolveEntry, resolveProjectRoot } from "./shared.ts";

async function main() {
  try {
    const projectRoot = resolveProjectRoot();
    const entry = resolveEntry(projectRoot);

    plugin(createAutoImportPlugin(projectRoot));
    await import(pathToFileURL(entry).href);
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}

await main();
