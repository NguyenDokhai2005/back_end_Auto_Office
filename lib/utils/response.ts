import { NextResponse } from 'next/server';

export class ApiResponse {
  static success<T>(data: T, status: number = 200) {
    return NextResponse.json({ data }, { status });
  }

  static error(message: string, status: number = 500, code?: string) {
    return NextResponse.json(
      { error: message, code },
      { status }
    );
  }

  static unauthorized(message: string = 'Unauthorized') {
    return NextResponse.json(
      { error: message, code: 'AUTH_ERROR' },
      { status: 401 }
    );
  }

  static badRequest(message: string) {
    return NextResponse.json(
      { error: message, code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  static notFound(message: string = 'Resource not found') {
    return NextResponse.json(
      { error: message, code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  static rateLimit(message: string = 'Rate limit exceeded') {
    return NextResponse.json(
      { error: message, code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }
}
