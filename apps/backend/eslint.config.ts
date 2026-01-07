import type { Linter } from 'eslint'

import vitestPlugin from '@vitest/eslint-plugin'

import rootConfig from '../../eslint.config.js'

const config: Linter.Config[] = [
  ...rootConfig,
  {
    plugins: {
      vitest: vitestPlugin,
    },
    languageOptions: {
      globals: {
        Request: 'readonly', // Web API Request used in tests
      },
    },
    rules: {
      'no-console': 'off', // Console is fine in backend
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Enums are not allowed. Use const objects with "as const" instead.',
        },
      ],
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
