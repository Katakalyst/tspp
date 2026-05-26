# tspp

`tspp` is a Bun template for TypeScript++ projects.

## Create A Project From This Template

```bash
bun create Katakalyst/tspp my-app
```

Enter the new project and start in `index.ts`, `main.ts`, or `src/`.
The `.tspp` folder is for internals only and shouldnt be touched.

## Commands

- `bun run dev` starts watch mode
- `bun run once` runs once in development mode
- `bun run prod` runs once in production mode
- `bun run build` builds to `dist/`
- `bun run format` formats the project with Biome
- `bun run check` runs formatting checks, type checks, and tests
