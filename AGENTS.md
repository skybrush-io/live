# Code

## TypeScript

- Strict typing
- Use `type` instead of `interface`
- Avoid `const x = y as unknown as SomeType` cast patterns
- Allow non-null assertions (`!`), but document justification
- No return type annotation for React components
- Import types explicitly with `import type`

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
- Redux-connected components: non-connected version with standard name, connected component with "Connected" prefix
- Avoid complex UI sections within a component

## I18n

- All new UI text must be internationalized
- Never concatenate translated strings, use interpolation in the i18n resource

## Redux

- Redux Toolkit patterns
- Non-trivial selectors with `createSelector`

## Static analysis

`npm run` scripts:

- `type:check`: TS type checking
- `format:check`, `format:fix`: Formatting check or fix
- `lint:check`, `lint:fix`: ESLint linting check or fix

# General

**Never**:

- Build or run the project
- Run or add tests
- Output explanations or unnecessary code snippets
- Stage or commit changes without explicit request

**Always**:

- Fully understand the task, intent, and related code first
- State your assumptions, ff something is unclear, stop and ask for clarification!
- Follow clean code principles
- Do surgical changes: change only what you must, and keep it simple, minimal, easy to understand
- Be concise!
