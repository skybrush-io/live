/// <reference types="webpack/module" />

// Hot module replacement API of `webpack`; the `hot` property is declared in
// `webpack/module`, but the global `module` variable itself is normally
// declared by `@types/node`, which we do not use
declare const module: NodeJS.Module;

// From `GitRevisionPlugin` via `webpack`
declare const COMMIT_HASH: string;
declare const VERSION: string;

// Allow side-effect imports for several file types
declare module '*.css' {}
declare module '*.less' {}
