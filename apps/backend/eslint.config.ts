import type { Linter } from 'eslint'

import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vitestPlugin from '@vitest/eslint-plugin'

import rootConfig from '../../eslint.config.js'

const config: Linter.Config[] = [
  ...rootConfig,
  {
    plugins: {
      '@typescript-eslint': tseslint,
      vitest: vitestPlugin,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        Request: 'readonly', // Web API Request used in tests
      },
    },
    rules: {
      'no-console': 'off', // Console is fine in backend
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
    },
  },
]

export default config
