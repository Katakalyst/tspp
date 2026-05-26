# .tspp internals

This folder contains the internal implementation for the `tspp` template.

## Config layout

The real tool configs live here:

- `biome.json`
- `biome.check.json`
- `eslint.config.mjs`
- `tsconfig.json`

The repo root keeps tiny shim files for tool discovery:

- `/biome.json`
- `/eslint.config.mjs`
- `/tsconfig.json`

That keeps the actual config out of the main project surface while still
making VS Code, TypeScript, Biome, and ESLint work normally.

## Check vs format

- `bun run format` formats the whole repo, including `.tspp`
- `bun run check` skips `.tspp` for Biome to keep normal checks faster

The idea is:

- internal template work should still be formattable during development
- normal users of the template should not pay the `.tspp` cost on every check

## Language rules

ESLint is used for language-level restrictions that Biome does not model.

Current rules include:

- global `Math` is forbidden unless the user defines their own `Math`
- `class` is forbidden
- `enum` is forbidden
