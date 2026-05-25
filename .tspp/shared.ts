import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ENTRY_CANDIDATES = [
  "main.ts",
  "index.ts",
  "src/main.ts",
  "src/index.ts",
] as const;

export function resolveProjectRoot(): string {
  return process.cwd();
}

export function resolveEntry(projectRoot: string): string {
  for (const candidate of ENTRY_CANDIDATES) {
    const entryPath = join(projectRoot, candidate);

    if (existsSync(entryPath)) {
      return entryPath;
    }
  }

  throw new Error(
    `Could not find an entry file in ${projectRoot}. Looked for ${ENTRY_CANDIDATES.join(", ")}.`,
  );
}

export function resolveOutdir(args: string[]): string {
  let outdir = "dist";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--outdir") {
      const value = args[index + 1];

      if (!value) {
        throw new Error("Missing value for --outdir.");
      }

      outdir = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return resolve(outdir);
}

export function printError(error: unknown) {
  if (error instanceof AggregateError) {
    console.error(error.message);

    for (const item of error.errors) {
      if (item && typeof item === "object" && "message" in item) {
        console.error(String(item.message));
      } else {
        console.error(String(item));
      }
    }

    return;
  }

  if (error instanceof Error) {
    console.error(error.message);
    return;
  }

  console.error(String(error));
}
