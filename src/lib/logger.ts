/**
 * Structured logger voor server-side gebruik.
 * In productie: JSON output (compatibel met Vercel Log Drains, Datadog, Axiom).
 * In development: leesbare console output.
 */

type LogLevel  = 'info' | 'warn' | 'error'
type LogFields = Record<string, unknown>

function log(level: LogLevel, message: string, fields: LogFields = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  }

  if (process.env.NODE_ENV === 'production') {
    // JSON voor log aggregatie
    console[level](JSON.stringify(entry))
  } else {
    const prefix = `[${level.toUpperCase()}]`
    const extra  = Object.keys(fields).length ? fields : ''
    console[level](prefix, message, extra)
  }
}

export const logger = {
  info:  (message: string, fields?: LogFields) => log('info',  message, fields),
  warn:  (message: string, fields?: LogFields) => log('warn',  message, fields),
  error: (message: string, fields?: LogFields) => log('error', message, fields),
}
