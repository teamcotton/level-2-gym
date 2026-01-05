import { defineConfig } from 'evalite/config'

export default defineConfig({
  // Specify where your eval files are located
  evalPaths: ['evals/**/*.eval.ts'],

  // Output directory for eval results
  outputDir: '.evalite',

  // Reporter configuration
  reporters: ['console', 'json'],

  // Parallel execution of evals (set to 1 for sequential)
  maxConcurrency: 1,

  // Timeout for each eval task (in ms)
  timeout: 120000, // 2 minutes per task

  // Retry failed tasks
  retries: 0,
})
