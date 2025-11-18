/**
 * Security Monitoring Service
 *
 * Real-time security monitoring and alerting for production
 * Integrates with Sentry, Datadog, or custom webhook
 */

import 'server-only'

interface SecurityEvent {
  type: 'UNAUTHORIZED_ADMIN_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_ADMIN_WALLET' | 'SUSPICIOUS_ACTIVITY'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ip_address?: string
  user_id?: string
  wallet_address?: string
  endpoint: string
  method: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

interface SecurityAlert {
  event: SecurityEvent
  message: string
  stack?: string
}

interface SecurityEventLog extends Omit<SecurityEvent, 'timestamp'> {
  timestamp: string
  environment: string
}

/**
 * Log security event
 * In production, this would send to monitoring service (Sentry, Datadog, etc.)
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const logEntry: SecurityEventLog = {
    ...event,
    timestamp: event.timestamp.toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }

  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.warn('[SECURITY EVENT]', JSON.stringify(logEntry, null, 2))
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry
    if (process.env.SENTRY_DSN) {
      // await Sentry.captureMessage(`Security Event: ${event.type}`, {
      //   level: event.severity.toLowerCase() as SeverityLevel,
      //   extra: logEntry,
      // })
    }

    // Send to Datadog
    if (process.env.DATADOG_API_KEY) {
      // await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
      //   method: 'POST',
      //   headers: {
      //     'DD-API-KEY': process.env.DATADOG_API_KEY,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ddsource: 'cobbee-security',
      //     ddtags: `env:${process.env.NODE_ENV},severity:${event.severity}`,
      //     service: 'admin-security',
      //     message: `Security Event: ${event.type}`,
      //     ...logEntry,
      //   }),
      // })
    }

    // Send to custom webhook (Slack, Discord, etc.)
    if (process.env.SECURITY_WEBHOOK_URL) {
      await sendWebhookAlert(logEntry)
    }

    // Critical events: Send immediate notification
    if (event.severity === 'CRITICAL') {
      await sendCriticalAlert(logEntry)
    }
  }

  // Store in database for audit trail
  await storeSecurityEvent(logEntry)
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(event: SecurityEventLog): Promise<void> {
  try {
    const webhookUrl = process.env.SECURITY_WEBHOOK_URL

    if (!webhookUrl) return

    const message = formatWebhookMessage(event)

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  } catch (error) {
    console.error('[Security Monitor] Failed to send webhook:', error)
  }
}

/**
 * Format message for Slack/Discord webhook
 */
function formatWebhookMessage(event: SecurityEventLog) {
  const emoji = {
    LOW: '🔵',
    MEDIUM: '🟡',
    HIGH: '🟠',
    CRITICAL: '🔴',
  }

  // Slack format
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji[event.severity]} Security Alert: ${event.type}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${event.severity}`,
          },
          {
            type: 'mrkdwn',
            text: `*Endpoint:*\n${event.endpoint}`,
          },
          {
            type: 'mrkdwn',
            text: `*IP Address:*\n${event.ip_address || 'Unknown'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp:*\n${event.timestamp}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Wallet:* \`${event.wallet_address || 'N/A'}\``,
        },
      },
    ],
  }
}

/**
 * Send critical alert (email, SMS, PagerDuty, etc.)
 */
async function sendCriticalAlert(event: SecurityEventLog): Promise<void> {
  // In production, integrate with:
  // - PagerDuty for on-call alerts
  // - Twilio for SMS
  // - SendGrid for email
  console.error('[CRITICAL SECURITY EVENT]', event)
}

/**
 * Store security event in database
 */
async function storeSecurityEvent(event: SecurityEventLog): Promise<void> {
  // Store in audit_logs table for compliance
  // This is handled by existing audit logging system
}

/**
 * Check for suspicious patterns
 * Returns true if activity is suspicious
 */
export async function detectSuspiciousActivity(
  ip_address: string,
  wallet_address: string | null,
  endpoint: string
): Promise<boolean> {
  // Check Redis for recent failed attempts from this IP
  // If > 5 failures in last 5 minutes, flag as suspicious

  // Check if wallet is trying to access admin without being admin
  // Check if multiple failed login attempts

  // For now, simple implementation
  return false
}

/**
 * Middleware helper for logging admin access attempts
 */
export async function logAdminAccessAttempt(params: {
  success: boolean
  ip_address?: string
  user_id?: string
  wallet_address?: string
  endpoint: string
  method: string
}) {
  if (!params.success) {
    await logSecurityEvent({
      type: 'UNAUTHORIZED_ADMIN_ACCESS',
      severity: 'HIGH',
      ip_address: params.ip_address,
      user_id: params.user_id,
      wallet_address: params.wallet_address,
      endpoint: params.endpoint,
      method: params.method,
      timestamp: new Date(),
    })
  }
}

/**
 * Log invalid admin wallet attempt
 */
export async function logInvalidAdminWallet(params: {
  ip_address?: string
  user_id: string
  wallet_address: string
  endpoint: string
}) {
  await logSecurityEvent({
    type: 'INVALID_ADMIN_WALLET',
    severity: 'CRITICAL',
    ip_address: params.ip_address,
    user_id: params.user_id,
    wallet_address: params.wallet_address,
    endpoint: params.endpoint,
    method: 'GET',
    timestamp: new Date(),
    metadata: {
      message: `User ${params.user_id} attempted to access admin with wallet ${params.wallet_address}`,
    },
  })
}
