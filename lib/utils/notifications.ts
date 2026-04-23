import { logError, logInfo } from './logger';

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpHost?: string;
    smtpPort?: number;
    fromEmail?: string;
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
}

export interface ErrorNotification {
  type: 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  error?: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
}

// Get notification config from environment
function getNotificationConfig(): NotificationConfig {
  return {
    email: {
      enabled: process.env.ERROR_EMAIL_ENABLED === 'true',
      recipients: process.env.ERROR_EMAIL_RECIPIENTS?.split(',') || [],
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
      fromEmail: process.env.ERROR_FROM_EMAIL,
    },
    webhook: {
      enabled: process.env.ERROR_WEBHOOK_ENABLED === 'true',
      url: process.env.ERROR_WEBHOOK_URL || '',
      headers: process.env.ERROR_WEBHOOK_HEADERS 
        ? JSON.parse(process.env.ERROR_WEBHOOK_HEADERS)
        : undefined,
    },
  };
}

// Send error notification
export async function notifyError(
  message: string,
  error: Error | unknown,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  context?: Record<string, any>
) {
  const config = getNotificationConfig();

  const notification: ErrorNotification = {
    type: 'error',
    severity,
    message,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  // Only send notifications for high and critical errors
  if (severity !== 'high' && severity !== 'critical') {
    logInfo('Error logged but not notified (severity too low)', notification);
    return;
  }

  // Send email notification
  if (config.email?.enabled && config.email.recipients.length > 0) {
    await sendEmailNotification(notification, config.email);
  }

  // Send webhook notification
  if (config.webhook?.enabled && config.webhook.url) {
    await sendWebhookNotification(notification, config.webhook);
  }
}

// Send email notification (placeholder - requires email service integration)
async function sendEmailNotification(
  notification: ErrorNotification,
  emailConfig: NonNullable<NotificationConfig['email']>
) {
  try {
    // TODO: Implement email sending using nodemailer or similar
    // For now, just log that we would send an email
    logInfo('Email notification would be sent', {
      recipients: emailConfig.recipients,
      subject: `[${notification.severity.toUpperCase()}] ${notification.message}`,
      notification,
    });

    // In production, you would use something like:
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: emailConfig.smtpHost,
    //   port: emailConfig.smtpPort,
    //   secure: emailConfig.smtpPort === 465,
    //   auth: { user: emailConfig.fromEmail, pass: process.env.SMTP_PASSWORD }
    // });
    // await transporter.sendMail({
    //   from: emailConfig.fromEmail,
    //   to: emailConfig.recipients.join(','),
    //   subject: `[${notification.severity.toUpperCase()}] ${notification.message}`,
    //   html: formatEmailBody(notification)
    // });
  } catch (error) {
    logError({ 
      requestId: 'notification', 
      method: 'EMAIL', 
      path: '/notification', 
      timestamp: new Date().toISOString() 
    }, error);
  }
}

// Send webhook notification
async function sendWebhookNotification(
  notification: ErrorNotification,
  webhookConfig: NonNullable<NotificationConfig['webhook']>
) {
  try {
    const response = await fetch(webhookConfig.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...webhookConfig.headers,
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}`);
    }

    logInfo('Webhook notification sent successfully', {
      url: webhookConfig.url,
      status: response.status,
    });
  } catch (error) {
    logError({ 
      requestId: 'notification', 
      method: 'WEBHOOK', 
      path: '/notification', 
      timestamp: new Date().toISOString() 
    }, error);
  }
}

// Format email body (helper function)
function formatEmailBody(notification: ErrorNotification): string {
  return `
    <h2>Error Notification</h2>
    <p><strong>Severity:</strong> ${notification.severity.toUpperCase()}</p>
    <p><strong>Message:</strong> ${notification.message}</p>
    <p><strong>Error:</strong> ${notification.error}</p>
    <p><strong>Timestamp:</strong> ${notification.timestamp}</p>
    ${notification.context ? `<p><strong>Context:</strong> <pre>${JSON.stringify(notification.context, null, 2)}</pre></p>` : ''}
    ${notification.stack ? `<p><strong>Stack Trace:</strong> <pre>${notification.stack}</pre></p>` : ''}
  `;
}
