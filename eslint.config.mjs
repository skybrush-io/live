import eslint from '@eslint/js';
import react from 'eslint-plugin-react';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  globalIgnores(['build']),

  {
    // Allow eslint-plugin-react to detect the React version automatically
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  {
    files: [
      'src/desktop/launcher/*.{js,mjs}',
      'src/desktop/preload/*.{js,mjs}',
      'webpack/*.js',
    ],
    rules: {
      // Allow require() imports in Webpack config files and Electron preload scripts
      '@typescript-eslint/no-require-imports': 'off',
    },
    languageOptions: {
      globals: {
        // We need to teach ESLint that we have the Node globals in Webpack
        // config files
        ...globals.node,
      },
    },
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Use Array<T> for more complex stuff but T[] for simple types.
      // Improves readability in most cases.
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // Enforce using 'type' over 'interface' for type definitions.
      // Common agreement within the team.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // Check whether imports are used only as types and enforce using
      // type-only imports in such cases. This aids with preventing circular
      // imports in certain cases.
      '@typescript-eslint/consistent-type-imports': 'error',

      // Disable the rule that bans the use of the 'any' type.
      // We want to be able to use 'any' in certain cases, especially
      // when dealing with third-party libraries without proper typings.
      // Also, let's be pragmatic: spending 30+ mins on getting the typing of
      // an obscure utility function right is probably not worth it.
      '@typescript-eslint/no-explicit-any': 'off',

      // Enable non-null assertions for now; we may want to revisit this later.
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Allow unused variables in rest siblings (e.g. object destructuring).
      // This is commonly used to omit certain properties from objects.
      //
      // Also allow a leading underscore to mark intentionally unused variables,
      // which may be necessary sometimes to aid TypeScript with type inference
      // (e.g., by specifying the type of an argument that we don't use if it
      // influences the inferred type).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
    },
  }
);
