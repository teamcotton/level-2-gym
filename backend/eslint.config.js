import rootConfig from '../eslint.config.js';

export default [
  ...rootConfig,
  {
    rules: {
      'no-console': 'off', // Console is fine in backend
    },
  },
];
