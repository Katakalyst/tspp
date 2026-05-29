# .tspp internals

This folder contains the internal implementation for the `tspp` template.

## Folder layout

The internal implementation is split by responsibility:

- `cli/` contains the Bun entrypoints used by root scripts
- `compiler/` contains the Bun plugin and TypeScript transform
- `config/` contains Biome, ESLint, and TypeScript configs
- `declarations/` contains hand-authored userland ambient type scaffolding
- `runtime/` contains the tspp runtime exported through `#tspp/types`
- `test-support/` contains Bun test preload wiring
- `tests/` contains template-internal regression tests

The repo root keeps tiny shim files for tool discovery:

- `/biome.json`
- `/eslint.config.mjs`
- `/tsconfig.json`

That keeps the actual config out of the main project surface while still making
VS Code, TypeScript, Biome, and ESLint work normally.

TypeScript is split on purpose:

- `config/tsconfig.user.json` is the userland tspp view
- `config/tsconfig.internal.json` is the `.tspp` implementation view
- `declarations/compiler.user.d.ts` is minimal compiler scaffolding required by
  `noLib`
- userland uses `noLib`, so JavaScript standard library types do not exist

## User scripts vs internals

Root `package.json` scripts are for userland projects only. They may call
`.tspp` implementation files to run, build, or transform a user's code, but
they should not run template-internal checks or tests.

Current script boundaries:

- `bun run format` formats userland files only
- `bun run check` runs userland formatting checks, ESLint, TypeScript, and
  userland tests
- template-internal tests should live under `.tspp` and be run directly by path
  during template development

Template-internal maintenance commands:

- Format internals with
  `bunx biome check --write --config-path .tspp/config/biome.json .tspp`
- Typecheck internals with
  `bunx tsc --noEmit -p .tspp/config/tsconfig.internal.json`
- Run an internal test with `bun test ./.tspp/tests/<name>.test.ts`
Do not add these commands to root `package.json` scripts; those scripts are part
of the template user's project surface.

Generated files:

- `bun-plugin-auto-imports` writes its generated declarations to
  `.tspp-cache/auto-imports.d.ts`
- `.tspp-cache/` is ignored and should not be committed
- userland built-ins that must be visible to the editor belong in
  `declarations/`

## Language rules

ESLint is used for language-level restrictions that Biome does not model.

Current rules include:

- userland runs with `noLib`, so most JavaScript globals and standard library
  types simply do not exist
- compiler-scaffolding names like `String` and `Array` still exist only so
  TypeScript can function, but they are forbidden in userland source
- `undefined` is forbidden
- `null` is forbidden
- `class` is forbidden
- `enum` is forbidden
- `new`, `this`, `throw`, and `try/catch` are forbidden
- `for..in`, `for(;;)`, `while`, `do..while`, `++`, and `--` are forbidden

## Option primitive

`None` is not `null`. It is a unique symbol exported from `#tspp/types`.

Related exports:

- `None`
- `Some(value)`
- `isNone(value)`
- `isSome(value)`
- `Option<T>`

## Result primitive

`Result<T, E>` is the replacement direction for `throw` and `try/catch`.

Related exports:

- `Ok(value)`
- `Err(error)`
- `isOk(value)`
- `isErr(value)`
- `Result<T, E>`

## Iterator direction

The current tspp iterator shape is:

- `done: boolean`
- `value: Option<T>`
- `next(): Iterator<T>`

Values can expose `iter(): Iterator<T>`.

`for...of` accepts either:

- a direct `Iterator<T>`
- or any value with `iter(): Iterator<T>`

The loop transform turns tspp `for...of` into internal iterator-stepping code,
which means normal `break` and `continue` work again without needing a special
flow iterator type.

## List direction

`List` is backed internally by Immutable.js, but tspp exposes a curated surface
instead of the raw Immutable API.

Current internal construction uses `List.of(...)`, while the user-facing method
surface is:

- `iter()`
- `size()`
- `at(index)`
- `push(...values)`
- `pop()`
- `unshift(...values)`
- `shift()`
- `insert(index, value)`
- `delete(index)`
- `remove(index)`
- `slice(begin, end)`
- `concat(...lists)`
- `clear()`
- `flat()`
- `map(fn)`
- `filter(fn)`
- `reverse()`
- `sort()`
- `findIndex(fn)`
- `some(fn)`
- `every(fn)`
- `join()`

Important semantics:

- `at(index)` returns `Option<T>`
- `pop()` returns `Option<List<T>>`
- `shift()` returns `Option<List<T>>`
- `findIndex(fn)` returns `Option<number>`
- the raw Immutable getters like `.size`, `.get`, `.set`, and `.has` are not
  part of the tspp surface
- indexed reads are rewritten so `x[i]` becomes `x.at(i)`
- indexed writes are not defined yet and are not rewritten

Current decisions to keep in mind:

- `range(...)` is wanted, but not yet a current implementation priority
- `x[i] = y` should be invalid rather than rewritten into custom list-update
  semantics
- `flat()` should flatten deeply
- `List` is currently the only array-like collection; tuple support is wanted
  later, but it is a separate fixed-size data structure and not part of the
  current work
- `sort()` should eventually require an explicit sort function instead of
  relying on default ordering
- `join()` should require a separator string and return a string built with
  that separator
- string literals should eventually be rewritten into a tspp text type with a
  custom underlying representation
- numeric literals should eventually be rewritten into a tspp number type with
  a custom underlying representation
