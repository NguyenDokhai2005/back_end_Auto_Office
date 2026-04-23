import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/utils/response';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('ApiResponse Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('should create success response with default status 200', () => {
      const data = { message: 'Success' };
      
      ApiResponse.success(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 200 }
      );
    });

    it('should create success response with custom status', () => {
      const data = { id: '123', name: 'Test' };
      
      ApiResponse.success(data, 201);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 201 }
      );
    });

    it('should handle null data', () => {
      ApiResponse.success(null);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: null },
        { status: 200 }
      );
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      
      ApiResponse.success(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 200 }
      );
    });

    it('should handle complex nested objects', () => {
      const data = {
        user: {
          id: '123',
          profile: {
            name: 'John',
            settings: { theme: 'dark' }
          }
        },
        workflows: [{ id: 'wf1' }]
      };
      
      ApiResponse.success(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 200 }
      );
    });
  });

  describe('error', () => {
    it('should create error response with default status 500', () => {
      const message = 'Something went wrong';
      
      ApiResponse.error(message);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: message },
        { status: 500 }
      );
    });

    it('should create error response with custom status', () => {
      const message = 'Bad request';
      
      ApiResponse.error(message, 400);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: message },
        { status: 400 }
      );
    });

    it('should create error response with code', () => {
      const message = 'Validation failed';
      const code = 'VALIDATION_ERROR';
      
      ApiResponse.error(message, 400, code);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: message, code },
        { status: 400 }
      );
    });
  });

  describe('badRequest', () => {
    it('should create 400 bad request response', () => {
      const message = 'Invalid input';
      
      ApiResponse.badRequest(message);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: message, code: 'BAD_REQUEST' },
        { status: 400 }
      );
    });
  });

  describe('unauthorized', () => {
    it('should create 401 unauthorized response', () => {
      const message = 'Access denied';
      
      ApiResponse.unauthorized(message);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: message, code: 'AUTH_ERROR' },
        { status: 401 }
      );
    });

    it('should create unauthorized response with default message', () => {
      ApiResponse.unauthorized();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    });
  });

  describe('notFound', () => {
    it('should create 404 not found response', () => {
      const message = 'Resource not found';
      
      ApiResponse.notFound(message);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: message, code: 'NOT_FOUND' },
        { status: 404 }
      );
    });

    it('should create not found response with default message', () => {
      ApiResponse.notFound();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Resource not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    });
  });

  describe('rateLimit', () => {
    it('should create 429 rate limit response', () => {
      const message = 'Too many requests';
      
      ApiResponse.rateLimit(message);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: message, code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    });

    it('should create rate limit response with default message', () => {
      ApiResponse.rateLimit();

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    });
  });
});