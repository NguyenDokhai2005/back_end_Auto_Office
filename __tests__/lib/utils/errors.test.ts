import { NextResponse } from 'next/server';
import {
  errorResponse,
  successResponse,
  validateRequired,
  validateEmail,
  validatePassword,
} from '@/lib/utils/errors';
import {
  ApiError,
  ValidationError,
  AuthError,
  NotFoundError,
  RateLimitError,
} from '@/types';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('Error Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorResponse', () => {
    it('should handle ApiError correctly', () => {
      const error = new ApiError('Test error', 400, 'TEST_ERROR');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Test error',
          code: 'TEST_ERROR',
        },
        { status: 400 }
      );
    });

    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Invalid input');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    });

    it('should handle AuthError correctly', () => {
      const error = new AuthError('Access denied');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Access denied',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      );
    });

    it('should handle NotFoundError correctly', () => {
      const error = new NotFoundError('Resource not found');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Resource not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    });

    it('should handle RateLimitError correctly', () => {
      const error = new RateLimitError('Too many requests');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    });

    it('should handle generic Error with auth keywords', () => {
      const error = new Error('Unauthorized access');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    });

    it('should handle generic Error with auth in message', () => {
      const error = new Error('auth failed');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    });

    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Something went wrong' },
        { status: 500 }
      );
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      
      errorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal server error' },
        { status: 500 }
      );
    });

    it('should log all errors', () => {
      const error = new Error('Test error');
      
      errorResponse(error);

      expect(console.error).toHaveBeenCalledWith('API Error:', error);
    });
  });

  describe('successResponse', () => {
    it('should create success response with default status', () => {
      const data = { message: 'Success' };
      
      successResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 200 }
      );
    });

    it('should create success response with custom status', () => {
      const data = { id: '123' };
      
      successResponse(data, 201);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 201 }
      );
    });

    it('should handle null data', () => {
      successResponse(null);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: null },
        { status: 200 }
      );
    });

    it('should handle array data', () => {
      const data = [1, 2, 3];
      
      successResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data },
        { status: 200 }
      );
    });
  });

  describe('validateRequired', () => {
    it('should pass validation when all required fields are present', () => {
      const fields = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).not.toThrow();
    });

    it('should throw ValidationError when required field is missing', () => {
      const fields = {
        name: 'John',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow(ValidationError);
      
      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: email');
    });

    it('should throw ValidationError when multiple required fields are missing', () => {
      const fields = {
        name: 'John',
      };
      const requiredFields = ['name', 'email', 'password'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: email, password');
    });

    it('should treat empty string as missing', () => {
      const fields = {
        name: '',
        email: 'john@example.com',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: name');
    });

    it('should treat null as missing', () => {
      const fields = {
        name: null,
        email: 'john@example.com',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: name');
    });

    it('should treat undefined as missing', () => {
      const fields = {
        email: 'john@example.com',
      };
      const requiredFields = ['name', 'email'];

      expect(() => {
        validateRequired(fields, requiredFields);
      }).toThrow('Missing required fields: name');
    });
  });

  describe('validateEmail', () => {
    it('should pass validation for valid email', () => {
      expect(() => {
        validateEmail('john@example.com');
      }).not.toThrow();
    });

    it('should pass validation for valid email with subdomain', () => {
      expect(() => {
        validateEmail('user@mail.example.com');
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid email format', () => {
      expect(() => {
        validateEmail('invalid-email');
      }).toThrow(ValidationError);
      
      expect(() => {
        validateEmail('invalid-email');
      }).toThrow('Invalid email format');
    });

    it('should throw ValidationError for email without @', () => {
      expect(() => {
        validateEmail('userexample.com');
      }).toThrow('Invalid email format');
    });

    it('should throw ValidationError for email without domain', () => {
      expect(() => {
        validateEmail('user@');
      }).toThrow('Invalid email format');
    });

    it('should throw ValidationError for email without local part', () => {
      expect(() => {
        validateEmail('@example.com');
      }).toThrow('Invalid email format');
    });

    it('should throw ValidationError for email with spaces', () => {
      expect(() => {
        validateEmail('user @example.com');
      }).toThrow('Invalid email format');
    });
  });

  describe('validatePassword', () => {
    it('should pass validation for valid password', () => {
      expect(() => {
        validatePassword('password123');
      }).not.toThrow();
    });

    it('should pass validation for minimum length password', () => {
      expect(() => {
        validatePassword('123456');
      }).not.toThrow();
    });

    it('should throw ValidationError for short password', () => {
      expect(() => {
        validatePassword('12345');
      }).toThrow(ValidationError);
      
      expect(() => {
        validatePassword('12345');
      }).toThrow('Password must be at least 6 characters');
    });

    it('should throw ValidationError for empty password', () => {
      expect(() => {
        validatePassword('');
      }).toThrow('Password must be at least 6 characters');
    });

    it('should handle special characters in password', () => {
      expect(() => {
        validatePassword('p@ssw0rd!');
      }).not.toThrow();
    });
  });
});