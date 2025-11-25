// @ts-ignore - @sentry/node types may not be installed
import * as Sentry from '@sentry/node'

/**
 * Initialize Sentry error monitoring
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN

  if (!dsn) {
    console.log('[Sentry] No DSN configured, error monitoring disabled')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.RELEASE_VERSION || 'columbus-worker@1.0.0',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Only send errors in production
    enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,

    // Integrations
    integrations: [
      // Capture unhandled promise rejections
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn']
      })
    ],

    // Before sending, sanitize sensitive data
    beforeSend(event) {
      // Remove potentially sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
      return event
    },

    // Tag all events with worker info
    initialScope: {
      tags: {
        service: 'columbus-worker'
      }
    }
  })

  console.log('[Sentry] Error monitoring initialized')
}

/**
 * Capture an exception with context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, any>
    user?: { id: string; email?: string }
    level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'
  }
): string {
  const eventId = Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
    level: context?.level || 'error'
  })

  return eventId
}

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, any>
  }
): string {
  const eventId = Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra
  })

  return eventId
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level
  })
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; organizationId?: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    organizationId: user.organizationId
  } as any)
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null)
}

/**
 * Create a wrapped worker processor with error tracking
 */
export function withErrorTracking<T, R>(
  workerName: string,
  processor: (job: T) => Promise<R>
): (job: T) => Promise<R> {
  return async (job: T) => {
    addBreadcrumb('worker', `Processing job in ${workerName}`, { job })

    try {
      const result = await processor(job)
      return result
    } catch (error) {
      captureError(error as Error, {
        tags: {
          worker: workerName
        },
        extra: {
          job
        }
      })
      throw error
    }
  }
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): any {
  return Sentry.startInactiveSpan({
    name,
    op,
    forceTransaction: true
  })
}

/**
 * Flush pending events (call before shutdown)
 */
export async function flushEvents(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout)
}

export { Sentry }
