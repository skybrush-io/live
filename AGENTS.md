# Code

## TypeScript

- Strict typing
- Use `type` instead of `interface` for type definitions
- Never cast types using `const x = y as unknown as SomeType` patterns
- Allow non-null assertions (`!`), but document why it's justified
- Do not add return type annotation to React components
- Import types explicitly with `import type` unless it is also used as a value.

## Import groups

1. External libraries
2. `@skybrush` libraries
3. Internal modules with `~/` (alias for `./src/*`)
4. Relative imports

## Exports

- Named exports for utilities and non-React components
- Default export for React components

## React

- Use function components declared with `const Comp = () => {}` pattern
- Prop types defined as TypeScript types
- Redux-connected components: non-connected version with a standard name, connected component with "Connected" prefix
- Avoid complex UI sections within a component

## I18n

- All UI text must be internationalized
- Never concatenate translated strings, use interpolation in the i18n resource

## Redux

- Redux Toolkit patterns
- Non-trivial selectors with `createSelector`

## Formatting and linting

- Prettier for formatting
- ESLint for linting
- Use `npm run format:check` to check formatting
- Use `npm run lint:check` to check linting
- Use `npm run format:fix` to fix formatting issues
- Use `npm run lint:fix` to fix linting issues
- Never commit code with formatting or linting issues.

# General

**Never** (unless told to):

- Build or run the project
- Run or add tests
- Output explanations or unnecessary code snippets

**Always**:

- Fully understand the task and the related code before getting to work
- If something is unclear, ask for input
- Follow clean code principles
- Be succint
