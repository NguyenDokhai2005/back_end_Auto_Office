import { z } from 'zod';

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize SQL input to prevent injection
   */
  static sanitizeSql(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  /**
   * Remove potentially dangerous characters
   */
  static sanitizeGeneral(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>\"'%;()&+]/g, '')
      .trim();
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/g, '');
  }

  /**
   * Sanitize filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') return '';
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }
}

/**
 * Zod schemas for API validation
 */
export const ValidationSchemas = {
  // User authentication
  login: z.object({
    email: z.string().email('Invalid email format').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128)
  }),

  signup: z.object({
    email: z.string().email('Invalid email format').max(255),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    name: z.string().min(1).max(100).optional()
  }),

  // Workflow validation
  workflow: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    nodes: z.array(z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      position: z.object({
        x: z.number(),
        y: z.number()
      }),
      config: z.record(z.string(), z.any()).optional()
    })),
    edges: z.array(z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional()
    })),
    metadata: z.object({
      tags: z.array(z.string()).optional(),
      version: z.number().optional(),
      author: z.string().optional()
    }).optional()
  }),

  // AI chat validation
  aiChat: z.object({
    prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt too long'),
    provider: z.enum(['gemini', 'groq', 'openai']),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().min(1).max(4000).optional(),
    systemPrompt: z.string().max(2000).optional()
  }),

  // Execution validation
  execution: z.object({
    workflow_id: z.string().uuid('Invalid workflow ID'),
    status: z.enum(['running', 'completed', 'failed']).optional(),
    results: z.record(z.string(), z.any()).optional(),
    error: z.string().max(1000).optional()
  }),

  // Settings validation
  settings: z.object({
    email_config: z.object({
      smtp_host: z.string().max(255).optional(),
      smtp_port: z.number().min(1).max(65535).optional(),
      smtp_user: z.string().max(255).optional(),
      smtp_password: z.string().max(255).optional(),
      from_email: z.string().email().optional()
    }).optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark']).optional(),
      notifications: z.boolean().optional(),
      language: z.string().max(10).optional(),
      timezone: z.string().max(50).optional()
    }).optional()
  }),

  // Pagination validation
  pagination: z.object({
    page: z.number().min(1).max(1000).optional(),
    limit: z.number().min(1).max(100).optional(),
    search: z.string().max(255).optional()
  })
};

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid input'] };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams
): { page: number; limit: number; search: string } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const search = InputSanitizer.sanitizeGeneral(searchParams.get('search') || '');

  return { page, limit, search };
}

/**
 * Rate limiting validation
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const RATE_LIMIT_CONFIGS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  ai: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  upload: { windowMs: 60 * 1000, maxRequests: 10 } // 10 uploads per minute
};

/**
 * Content validation for file uploads
 */
export class FileValidator {
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check filename
    const sanitizedName = InputSanitizer.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      return { valid: false, error: 'Invalid filename characters' };
    }

    return { valid: true };
  }
}

/**
 * Environment variable validation
 */
export function validateEnvironmentVariables(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate URLs
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL');
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_APP_URL);
    } catch {
      throw new Error('Invalid NEXT_PUBLIC_APP_URL');
    }
  }
}