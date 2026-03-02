## TypeScript

- Strict typing
- Use `type` instead of `interface` for type definitions
- Use type-only imports
- Never cast types using patterns like this: `const x = y as unknown as SomeType`
- Allow non-null assertions (`!`) when appropriate, but add comment why it's justified
- Allow `any` type as pragmatic escape hatch for third-party libs
- If a named alias exists for a type, use the named alias
- Do not add return type annotation to React components

## Code

**Import groups**:

1. External libraries
2. `@skybrush` libraries
3. Internal modules with `~/` alias (maps to `./src/*`)
4. Relative imports

**Exports**:

- Use named exports for utilities and non-React components
- Use default export for React components

**React**:

- Use function components declared with `const Comp = () => {}` pattern
- Prop types defined as TypeScript types
- If a component is connected to the Redux store, create the base non-connected implementation with the desired component name. Then create a connected component with the same name and the "Connected" prefix. Finally default export the connected component.

**Redux**:

- Use Redux Toolkit patterns
- Non-trivial selectors are memoized with `createSelector`

## General

**Never do these** unless explicitly told to:

- Build or run the project
- Run tests
- Implement new tests
- Output explanations or unnecessary code snippets.

**Always**:

- Make sure you fully understand the task and the related code before making changes!
- Be succint unless asked for details!
- If something is unclear, ask for input before you continue!
- Follow clean code principles!
