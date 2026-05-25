import { plugin } from "bun";
import { createAutoImportPlugin } from "./plugin.ts";

plugin(createAutoImportPlugin(process.cwd()));
