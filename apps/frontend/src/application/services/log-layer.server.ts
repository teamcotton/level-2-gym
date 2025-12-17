import 'server-only'

import { redactionPlugin } from '@loglayer/plugin-redaction'
import { PinoTransport } from '@loglayer/transport-pino'
import { LogLayer } from 'loglayer'
import { pino } from 'pino'

// Server-side logger using Pino
// Note: pino-pretty transport disabled because worker threads are not supported in Next.js
export const logger = new LogLayer({
  transport: new PinoTransport({
    logger: pino({
      level: process.env.LOG_LEVEL ?? 'info',
      // Basic JSON logging - pino-pretty cannot be used in Next.js (requires worker threads)
    }),
  }),
  plugins: [
    redactionPlugin({
      paths: ['password'],
      censor: '[REDACTED]',
    }),
  ],
  contextFieldName: 'context',
  metadataFieldName: 'metadata',
})
