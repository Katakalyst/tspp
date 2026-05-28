// biome-ignore-all lint/complexity/noBannedTypes lint/suspicious/noEmptyInterface lint/style/useConsistentTypeDefinitions: minimal compiler scaffolding required for noLib userland
interface String {}
interface Boolean {}
interface Number {}
interface Function {}
interface Object {}
interface RegExp {}
interface IArguments {}
interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
interface Array<T> {}

declare const console: {
  log(...values: unknown[]): void;
  error(...values: unknown[]): void;
};
