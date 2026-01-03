import type { Linter } from 'eslint'

import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vitestPlugin from '@vitest/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'

import rootConfig from '../../eslint.config.ts'

const config: Linter.Config[] = [
  ...rootConfig,
  {
    plugins: {
      '@typescript-eslint': tseslint,
      vitest: vitestPlugin,
      'simple-import-sort': simpleImportSort,
      'sort-destructure-keys': sortDestructureKeys,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'import/no-unresolved': 'off', // TypeScript handles module resolution
      'import/named': 'off', // TypeScript handles named exports
      'no-console': 'warn', // Shared package should minimize console usage
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Enums are not allowed. Use const objects with "as const" instead.',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'sort-destructure-keys/sort-destructure-keys': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'vitest/no-conditional-expect': 'off', // Allow conditional expects for type narrowing
    },
  },
]

export default config
