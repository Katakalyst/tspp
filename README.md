# tspp

`tspp` is TypeScript++: a language built on top of TypeScript.

You write your app in `index.ts`, `main.ts`, `src/index.ts`, or `src/main.ts`.
The internal `.tspp/` folder contains the tspp machinery that runs and builds your code.

## Commands

- `bun install`
- `bun run dev`: development mode, watches files
- `bun run once`: development mode, runs once
- `bun run prod`: production mode, runs once
- `bun run build`: builds to `dist/`

## Edit

- `index.ts`, `main.ts`, or `src/**`
- `package.json` for dependencies and metadata
- normal project files like `.gitignore` and `README.md`

## Leave Alone

- `.tspp/` because it contains the tspp internals
- the `package.json` scripts that point at `.tspp/`

## Notes

- normal Bun commands like `bun init`, `bun install`, and `bun add` still work
- `dist/` is build output and should not be committed
