/**
 * Cobbee Logger Utility
 * Centralized logging system with multiple log levels and environment-aware behavior
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Context-aware logging (auth, payment, support, etc.)
 * - Production-safe (logs only errors in production)
 * - Structured logging with timestamps
 * - Color-coded console output in development
 */

/* eslint-disable no-console */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum LogContext {
  AUTH = 'AUTH',
  WALLET = 'WALLET',
  EMAIL = 'EMAIL',
  OTP = 'OTP',
  PROFILE = 'PROFILE',
  SUPPORT = 'SUPPORT',
  PAYMENT = 'PAYMENT',
  DATABASE = 'DATABASE',
  API = 'API',
  UI = 'UI',
  SYSTEM = 'SYSTEM',
}

interface LogEntry {
  level: LogLevel
  context: LogContext
  message: string
  timestamp: string
  data?: unknown
  error?: Error
}

class Logger {
  private isDevelopment: boolean
  private isClient: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    this.isClient = typeof window !== 'undefined'
  }

  /**
   * Check if logging should occur based on environment and log level
   */
  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors
    if (!this.isDevelopment && level !== LogLevel.ERROR) {
      return false
    }
    return true
  }

  /**
   * Format log entry with timestamp and context
   */
  private formatLog(entry: LogEntry): string {
    const { level, context, message, timestamp } = entry
    return `[${timestamp}] [${level}] [${context}] ${message}`
  }

  /**
   * Get console color for log level (development only)
   */
  private getLogColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #6B7280' // Gray
      case LogLevel.INFO:
        return 'color: #0000FF' // Cobbee Blue
      case LogLevel.WARN:
        return 'color: #FF6B35' // Cobbee Orange
      case LogLevel.ERROR:
        return 'color: #EF4444; font-weight: bold' // Red bold
      default:
        return 'color: inherit'
    }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, context: LogContext, message: string, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      context,
      message,
      timestamp: new Date().toISOString(),
      data,
      error,
    }

    const formattedMessage = this.formatLog(entry)

    // Console output with styling in development
    if (this.isDevelopment && this.isClient) {
      const color = this.getLogColor(level)

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`%c${formattedMessage}`, color, data || '')
          break
        case LogLevel.INFO:
          console.info(`%c${formattedMessage}`, color, data || '')
          break
        case LogLevel.WARN:
          console.warn(`%c${formattedMessage}`, color, data || '')
          break
        case LogLevel.ERROR:
          console.error(`%c${formattedMessage}`, color, data || '', error || '')
          break
      }
    } else {
      // Server-side or production logging (plain console)
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data || '')
          break
        case LogLevel.INFO:
          console.info(formattedMessage, data || '')
          break
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '')
          break
        case LogLevel.ERROR:
          console.error(formattedMessage, data || '', error || '')
          break
      }
    }

    // TODO: Send error logs to monitoring service (Sentry, LogRocket, etc.)
    if (level === LogLevel.ERROR && !this.isDevelopment) {
      // this.sendToMonitoring(entry)
    }
  }

  /**
   * Log debug information (development only)
   * Use for detailed debugging, variable inspection
   */
  debug(context: LogContext, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, context, message, data)
  }

  /**
   * Log informational messages
   * Use for successful operations, user actions
   */
  info(context: LogContext, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, context, message, data)
  }

  /**
   * Log warning messages
   * Use for recoverable errors, deprecated features
   */
  warn(context: LogContext, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, context, message, data)
  }

  /**
   * Log error messages
   * Use for exceptions, failed operations, critical issues
   */
  error(context: LogContext, message: string, error?: Error, data?: unknown): void {
    this.log(LogLevel.ERROR, context, message, data, error)
  }

  /**
   * Convenience methods for common contexts
   */
  auth = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.AUTH, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.AUTH, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.AUTH, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.AUTH, message, error, data),
  }

  wallet = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.WALLET, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.WALLET, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.WALLET, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.WALLET, message, error, data),
  }

  email = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.EMAIL, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.EMAIL, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.EMAIL, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.EMAIL, message, error, data),
  }

  otp = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.OTP, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.OTP, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.OTP, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.OTP, message, error, data),
  }

  profile = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.PROFILE, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.PROFILE, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.PROFILE, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.PROFILE, message, error, data),
  }

  support = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.SUPPORT, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.SUPPORT, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.SUPPORT, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.SUPPORT, message, error, data),
  }

  payment = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.PAYMENT, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.PAYMENT, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.PAYMENT, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.PAYMENT, message, error, data),
  }

  database = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.DATABASE, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.DATABASE, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.DATABASE, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.DATABASE, message, error, data),
  }

  api = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.API, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.API, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.API, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.API, message, error, data),
  }

  ui = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.UI, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.UI, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.UI, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.UI, message, error, data),
  }

  system = {
    debug: (message: string, data?: unknown) => this.debug(LogContext.SYSTEM, message, data),
    info: (message: string, data?: unknown) => this.info(LogContext.SYSTEM, message, data),
    warn: (message: string, data?: unknown) => this.warn(LogContext.SYSTEM, message, data),
    error: (message: string, error?: Error, data?: unknown) => this.error(LogContext.SYSTEM, message, error, data),
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Usage Examples:
 *
 * // Basic usage
 * logger.info(LogContext.AUTH, 'User logged in', { userId: '123' })
 * logger.error(LogContext.DATABASE, 'Failed to insert user', error, { userId: '123' })
 *
 * // Context-specific shortcuts
 * logger.auth.info('User signed up successfully', { walletAddress: '0x...' })
 * logger.wallet.error('Blacklist check failed', error)
 * logger.otp.info('OTP sent to email', { email: 'user@example.com' })
 * logger.profile.warn('Username already taken', { username: 'johndoe' })
 * logger.support.info('New support created', { supportId: 'abc-123', amount: 15.00 })
 * logger.payment.error('Transaction failed', error, { txHash: '0x...' })
 *
 * // Debug logs (development only)
 * logger.auth.debug('Session state', { session, user })
 * logger.wallet.debug('Wallet connection state', { isConnected, address })
 */
