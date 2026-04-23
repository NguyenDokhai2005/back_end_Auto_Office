import { NextResponse } from 'next/server';
import { ApiError, ValidationError, AuthError, NotFoundError, RateLimitError } from '@/types';

// Error response formatter
export function errorResponse(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message === 'Unauthorized' || error.message.includes('auth')) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Success response formatter
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

// Validation helper
export function validateRequired(fields: Record<string, any>, requiredFields: string[]) {
  const missing = requiredFields.filter(field => {
    const value = fields[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

// Email validation
export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

// Password validation
export function validatePassword(password: string) {
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }
}
