# AGENTS.md

This file provides guidelines for agentic coding assistants working on the Skybrush Live codebase.

## Build, Lint, and Test Commands

### Essential Commands

- `npm run lint` - Run ESLint to check code quality
- `npm test` - Run all Jest tests
- `npm test -- path/to/test.test.ts` - Run a single test file
- `npm test -- -t "test name"` - Run tests matching a pattern
- `npm start` - Start development web server (http://localhost:8080)
- `npm run start:electron` - Start Electron desktop app
- `npm run bundle` - Build for production
- `npm run lint && npm test` - Run linting and tests together (run this before committing)

But you shouldn't try to build the project unless explicitly asked to do so!

### Testing Notes

- Jest is configured with TypeScript support
- Test files use `.test.ts` or `.test.tsx` extension
- Coverage is collected automatically in `coverage/` directory
- Use `test.skip()` to skip long-running tests (see test/nearestNeighbors.test.ts:82)

Never run tests unless explicitly asked!

## Code Style Guidelines

### File Format (.editorconfig)

- Encoding: UTF-8
- Indentation: 2 spaces (no tabs) for JS/JSX/TS/TSX/CSS/LESS
- Line endings: LF (Unix-style)
- Final newline: Required at end of files

### TypeScript Rules

- Strict mode enabled
- Use `type` instead of `interface` for type definitions (ESLint enforced)
- Use `T[]` for simple array types, `Array<T>` for complex types
- Use type-only imports: `import type { Foo } from 'bar'` (ESLint enforced)
- Path alias: `~/*` maps to `./src/*` (e.g., `~/utils/arrays`)
- Allow `any` type as pragmatic escape hatch for third-party libraries
- Allow non-null assertions (`!`) when appropriate
- Unused variables with leading underscore (`_unused`) are allowed
- Never cast types using patterns like this: `const x = y as unknown as SomeType`.
- If a named alias exists for a type, use the named alias, that makes the code easier to understand.

### Import Ordering

Import groups:

1. External libraries (e.g., `react`, `lodash-es/has`)
2. `@skybrush` libraries (e.g. `@skybrush/mui-components`)
3. Internal modules with `~/` alias (e.g., `~/utils/arrays`)
4. Relative imports (e.g., `./types`)

Type-only imports are grouped with regular imports, using `type` keyword.

### Naming Conventions

- **Variables/Functions**: camelCase
- **Components**: PascalCase
- **Types/Interfaces**: PascalCase (e.g., `type Coordinate2D`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `NEW_ITEM_ID`, `EMPTY_ARRAY`)
- **Files**: camelCase for utilities, PascalCase for components

### Export rules

- Use named exports for utilities and non-React components.
- Use default export for React components.

### Error Handling

- Use custom Error classes when needed (e.g., `class ItemExistsError extends Error`)
- Include helpful error messages
- Use try/catch for expected errors; allow errors to bubble up for unexpected ones

### Code Organization

- **Utilities**: Pure functions in `src/utils/` (e.g., arrays, collections, math)
- **Components**: Organized by feature in `src/components/` and `src/features/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Types**: Shared types in `src/types/` or co-located with usage
- **Selectors**: Redux selectors in `src/selectors/`
- **Sagas**: Redux sagas in `src/sagas/`

### React Patterns

- Use function components (declared with `const Comp = () => {}` pattern) with hooks
- Export default for components, named exports for utilities
- Use React hooks as needed
- Prop types defined as TypeScript types
- If component is connected to the Redux store, create the base non-connected implementation with the desired component name.
  Then create a connected component with the same name and the "Connected" prefix. Finally default export the connected component.
- Name components normally. Prefer not to use "Presentation" suffix in component names unless that's the used pattern in code you're editing.
- Use `useOwnState(props: Props)` hook pattern for deriving state from props within a component.
- Complex UI sections within a component should be extracted into separate components. They can be in the same file if small, or in separate files if more complex, for better modularity.

### Documentation

- Use JSDoc comments for exported functions and complex types
- Include parameter descriptions with `@param` tags
- Include return type descriptions with `@returns` tags
- Add inline comments for non-obvious logic

### Internationalization (i18n)

- **All UI text must be internationalized** - Never hardcode user-facing strings in JSX/TSX files
- Use translation keys for all text elements, including small UI elements like arrows/separator symbols
- **Use proper interpolation** - Define translation strings with `{{variable}}` placeholders and pass values as objects: `t('key', { value: ... })`
- **Don't concatenate translated strings** - Instead of `${t('a')} ${t('b')}`, use a single translation key with multiple parameters
- **Translation key organization** - Group related translations together in JSON files with consistent naming (e.g., `featureName.section.variableName`)
- When adding new UI text, always add corresponding translations to `src/i18n/en.json` (or appropriate language files)

### Redux/State Management

- Use Redux Toolkit patterns
- Selectors memoized with reselect (`createSelector`)

### Testing Patterns

- Use `describe` to group related tests
- Use `test` for individual test cases
- Arrange-Act-Assert pattern preferred
- Mock external dependencies
- Use `expect().toBe()`, `expect().toEqual()`, `expect().toThrow()` appropriately
- Skip long-running tests with `test.skip()`

### Performance Considerations

- Use `rejectNullish()` for filtering arrays (see src/utils/arrays.ts)
- Use `EMPTY_ARRAY` and `EMPTY_OBJECT` constants instead of `[]`/`{}`
- Memoize expensive computations with `memoize-one` or similar
- Use proper keys in lists (prefer stable IDs over array indices)

### Library Usage

- Use `lodash-es` for utility functions (tree-shakeable ES modules)
- Use `neverthrow` for Result/Either patterns
- Use `i18next` for internationalization (translation function: `tt`)
- Use `react-final-form` for forms with `mui-rff`
- Use Material-UI (@mui/material) for UI components

## Important Files and Directories

- `src/` - Main source code
- `test/` - Test files
- `webpack/` - Webpack configuration
- `eslint.config.mjs` - ESLint rules (flat config format)
- `tsconfig.json` - TypeScript configuration
- `jest.config.ts` - Jest test configuration
- `babel.config.json` - Babel transpilation config

## General Rules

- Be succint unless explicitly asked to be verbose.
- If something is unclear, ask for input before you continue.
- Don't output things or explanations that were not requested.
- Clearly modularize code, create the correct abstractions. Explore related parts of the codebase and use that as the guideline.
