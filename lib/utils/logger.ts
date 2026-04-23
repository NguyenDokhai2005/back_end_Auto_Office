import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  requestId: string;
  method: string;
  path: string;
  userId?: string;
  timestamp: string;
  duration?: number;
  statusCode?: number;
}

// Generate unique request ID
export function generateRequestId(): string {
  return uuidv4();
}

// Log API request
export function logRequest(request: NextRequest, userId?: string): LogContext {
  const requestId = generateRequestId();
  const method = request.method;
  const path = new URL(request.url).pathname;
  const timestamp = new Date().toISOString();

  const context: LogContext = {
    requestId,
    method,
    path,
    userId,
    timestamp,
  };

  console.log(`[${timestamp}] [${requestId}] ${method} ${path}${userId ? ` - User: ${userId}` : ''}`);

  return context;
}

// Log API response
export function logResponse(context: LogContext, statusCode: number, startTime: number) {
  const duration = Date.now() - startTime;
  const timestamp = new Date().toISOString();

  console.log(
    `[${timestamp}] [${context.requestId}] ${context.method} ${context.path} - ` +
    `Status: ${statusCode} - Duration: ${duration}ms`
  );

  return {
    ...context,
    statusCode,
    duration,
  };
}

// Log error
export function logError(context: LogContext, error: unknown) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(
    `[${timestamp}] [${context.requestId}] ERROR in ${context.method} ${context.path}:`,
    errorMessage
  );

  if (errorStack) {
    console.error(`[${timestamp}] [${context.requestId}] Stack trace:`, errorStack);
  }
}

// Log info message
export function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [INFO] ${message}`, data || '');
}

// Log warning message
export function logWarning(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] [WARN] ${message}`, data || '');
}

// Log debug message (only in development)
export function logDebug(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [DEBUG] ${message}`, data || '');
  }
}
