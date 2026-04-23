/**
 * Security Hardening Tests
 * Comprehensive tests for security features including:
 * - RLS policies
 * - Input sanitization
 * - Secret exposure
 * - CORS configuration
 * - Security headers
 */

import { InputSanitizer, ValidationSchemas, validateRequestBody } from '@/lib/security/validation';
import { SECURITY_HEADERS, CORS_CONFIG, applySecurityHeaders, applyCORSHeaders } from '@/lib/security/headers';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

describe('Security Hardening Tests', () => {
  describe('Input Sanitization', () => {
    describe('HTML Sanitization', () => {
      it('should sanitize HTML tags to prevent XSS', () => {
        const maliciousInput = '<script>alert("XSS")</script>';
        const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('</script>');
        expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
      });

      it('should sanitize HTML attributes', () => {
        const maliciousInput = '<img src=x onerror="alert(1)">';
        const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
        
        // HTML tags are escaped, making them safe
        expect(sanitized).toContain('&lt;');
        expect(sanitized).toContain('&gt;');
        expect(sanitized).not.toContain('<img');
        expect(sanitized).not.toContain('alert(1)'); // Should be escaped
      });

      it('should handle empty and non-string inputs', () => {
        expect(InputSanitizer.sanitizeHtml('')).toBe('');
        expect(InputSanitizer.sanitizeHtml(null as any)).toBe('');
        expect(InputSanitizer.sanitizeHtml(undefined as any)).toBe('');
      });
    });

    describe('SQL Injection Prevention', () => {
      it('should sanitize SQL injection attempts', () => {
        const maliciousInput = "'; DROP TABLE users; --";
        const sanitized = InputSanitizer.sanitizeSql(maliciousInput);
        
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('--');
        // Single quotes are escaped, making SQL injection safe
        expect(sanitized).toContain("''");
      });

      it('should escape single quotes', () => {
        const input = "O'Reilly";
        const sanitized = InputSanitizer.sanitizeSql(input);
        
        expect(sanitized).toBe("O''Reilly");
      });

      it('should remove SQL comments', () => {
        const input = "test /* comment */ value";
        const sanitized = InputSanitizer.sanitizeSql(input);
        
        expect(sanitized).not.toContain('/*');
        expect(sanitized).not.toContain('*/');
      });
    });

    describe('Email Sanitization', () => {
      it('should sanitize and normalize email addresses', () => {
        const email = 'User@Example.COM';
        const sanitized = InputSanitizer.sanitizeEmail(email);
        
        expect(sanitized).toBe('user@example.com');
      });

      it('should remove invalid characters from email', () => {
        const email = 'user<script>@example.com';
        const sanitized = InputSanitizer.sanitizeEmail(email);
        
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        // The word 'script' itself is valid in email, but tags are removed
        expect(sanitized).toBe('userscript@example.com');
      });
    });

    describe('Filename Sanitization', () => {
      it('should sanitize dangerous filename characters', () => {
        const filename = '../../../etc/passwd';
        const sanitized = InputSanitizer.sanitizeFilename(filename);
        
        expect(sanitized).not.toContain('/');
        // Dots and slashes are replaced with underscores
        expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
      });

      it('should limit filename length', () => {
        const longFilename = 'a'.repeat(300);
        const sanitized = InputSanitizer.sanitizeFilename(longFilename);
        
        expect(sanitized.length).toBeLessThanOrEqual(255);
      });

      it('should replace multiple underscores', () => {
        const filename = 'file___name.txt';
        const sanitized = InputSanitizer.sanitizeFilename(filename);
        
        expect(sanitized).toBe('file_name.txt');
      });
    });

    describe('General Sanitization', () => {
      it('should remove dangerous characters', () => {
        const input = 'test<>"\';()&+value';
        const sanitized = InputSanitizer.sanitizeGeneral(input);
        
        expect(sanitized).toBe('testvalue');
      });

      it('should trim whitespace', () => {
        const input = '  test value  ';
        const sanitized = InputSanitizer.sanitizeGeneral(input);
        
        expect(sanitized).toBe('test value');
      });
    });
  });

  describe('Input Validation Schemas', () => {
    describe('Login Validation', () => {
      it('should validate correct login credentials', () => {
        const validLogin = {
          email: 'user@example.com',
          password: 'SecurePass123'
        };
        
        const result = validateRequestBody(validLogin, ValidationSchemas.login);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('user@example.com');
        }
      });

      it('should reject invalid email format', () => {
        const invalidLogin = {
          email: 'not-an-email',
          password: 'SecurePass123'
        };
        
        const result = validateRequestBody(invalidLogin, ValidationSchemas.login);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors.some(e => e.includes('email'))).toBe(true);
        }
      });

      it('should reject short passwords', () => {
        const invalidLogin = {
          email: 'user@example.com',
          password: 'short'
        };
        
        const result = validateRequestBody(invalidLogin, ValidationSchemas.login);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors.some(e => e.includes('8 characters'))).toBe(true);
        }
      });
    });

    describe('Signup Validation', () => {
      it('should validate strong password requirements', () => {
        const validSignup = {
          email: 'user@example.com',
          password: 'SecurePass123',
          name: 'John Doe'
        };
        
        const result = validateRequestBody(validSignup, ValidationSchemas.signup);
        
        expect(result.success).toBe(true);
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'password',      // No uppercase or numbers
          'PASSWORD123',   // No lowercase
          'PasswordABC',   // No numbers
          'Pass1'          // Too short
        ];
        
        weakPasswords.forEach(password => {
          const result = validateRequestBody(
            { email: 'user@example.com', password },
            ValidationSchemas.signup
          );
          
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Workflow Validation', () => {
      it('should validate correct workflow structure', () => {
        const validWorkflow = {
          name: 'Test Workflow',
          description: 'A test workflow',
          nodes: [
            { id: 'node1', type: 'input', position: { x: 0, y: 0 } }
          ],
          edges: [
            { id: 'edge1', source: 'node1', target: 'node2' }
          ],
          metadata: { tags: ['test'], version: 1 }
        };
        
        const result = validateRequestBody(validWorkflow, ValidationSchemas.workflow);
        
        expect(result.success).toBe(true);
      });

      it('should reject workflow with missing required fields', () => {
        const invalidWorkflow = {
          description: 'Missing name',
          nodes: [],
          edges: []
        };
        
        const result = validateRequestBody(invalidWorkflow, ValidationSchemas.workflow);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors.some(e => e.includes('name'))).toBe(true);
        }
      });

      it('should reject workflow with name too long', () => {
        const invalidWorkflow = {
          name: 'a'.repeat(300),
          nodes: [],
          edges: []
        };
        
        const result = validateRequestBody(invalidWorkflow, ValidationSchemas.workflow);
        
        expect(result.success).toBe(false);
      });
    });

    describe('AI Chat Validation', () => {
      it('should validate AI chat request', () => {
        const validRequest = {
          prompt: 'Generate a blog post',
          provider: 'gemini' as const,
          temperature: 0.7,
          maxTokens: 1000
        };
        
        const result = validateRequestBody(validRequest, ValidationSchemas.aiChat);
        
        expect(result.success).toBe(true);
      });

      it('should reject invalid provider', () => {
        const invalidRequest = {
          prompt: 'Test',
          provider: 'invalid-provider'
        };
        
        const result = validateRequestBody(invalidRequest, ValidationSchemas.aiChat);
        
        expect(result.success).toBe(false);
      });

      it('should reject prompt that is too long', () => {
        const invalidRequest = {
          prompt: 'a'.repeat(6000),
          provider: 'gemini' as const
        };
        
        const result = validateRequestBody(invalidRequest, ValidationSchemas.aiChat);
        
        expect(result.success).toBe(false);
      });

      it('should reject invalid temperature range', () => {
        const invalidRequest = {
          prompt: 'Test',
          provider: 'gemini' as const,
          temperature: 1.5 // Out of range
        };
        
        const result = validateRequestBody(invalidRequest, ValidationSchemas.aiChat);
        
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Security Headers', () => {
    it('should include all required security headers', () => {
      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'X-XSS-Protection'
      ];
      
      requiredHeaders.forEach(header => {
        expect(SECURITY_HEADERS).toHaveProperty(header);
        expect(SECURITY_HEADERS[header as keyof typeof SECURITY_HEADERS]).toBeTruthy();
      });
    });

    it('should set X-Frame-Options to DENY', () => {
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    });

    it('should set X-Content-Type-Options to nosniff', () => {
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should include CSP with strict policies', () => {
      const csp = SECURITY_HEADERS['Content-Security-Policy'];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it('should apply security headers to response', () => {
      const response = new NextResponse();
      const securedResponse = applySecurityHeaders(response);
      
      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(securedResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should not include HSTS in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const response = new NextResponse();
      const securedResponse = applySecurityHeaders(response);
      
      expect(securedResponse.headers.get('Strict-Transport-Security')).toBeNull();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CORS Configuration', () => {
    it('should have proper CORS configuration', () => {
      expect(CORS_CONFIG.allowedOrigins).toBeDefined();
      expect(CORS_CONFIG.allowedMethods).toContain('GET');
      expect(CORS_CONFIG.allowedMethods).toContain('POST');
      expect(CORS_CONFIG.allowedMethods).toContain('PUT');
      expect(CORS_CONFIG.allowedMethods).toContain('DELETE');
    });

    it('should include required CORS headers', () => {
      expect(CORS_CONFIG.allowedHeaders).toContain('Content-Type');
      expect(CORS_CONFIG.allowedHeaders).toContain('Authorization');
    });

    it('should apply CORS headers for allowed origin', () => {
      const allowedOrigin = CORS_CONFIG.allowedOrigins[0];
      const response = new NextResponse();
      const corsResponse = applyCORSHeaders(response, allowedOrigin);
      
      expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigin);
      expect(corsResponse.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(corsResponse.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should not set CORS headers for disallowed origin', () => {
      const disallowedOrigin = 'https://malicious-site.com';
      const response = new NextResponse();
      const corsResponse = applyCORSHeaders(response, disallowedOrigin);
      
      // Should not set origin header for disallowed origins
      const allowOriginHeader = corsResponse.headers.get('Access-Control-Allow-Origin');
      expect(allowOriginHeader).not.toBe(disallowedOrigin);
    });

    it('should set appropriate max age for preflight cache', () => {
      expect(CORS_CONFIG.maxAge).toBeGreaterThan(0);
      expect(CORS_CONFIG.maxAge).toBeLessThanOrEqual(86400); // Max 24 hours
    });
  });

  describe('Secret Exposure Prevention', () => {
    it('should not expose secrets in environment example file', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      
      if (fs.existsSync(envExamplePath)) {
        const content = fs.readFileSync(envExamplePath, 'utf8');
        
        // Check for placeholder values
        expect(content).toContain('your-');
        
        // Should not contain actual API keys
        const dangerousPatterns = [
          /AKIA[0-9A-Z]{16}/, // AWS keys
          /sk-[a-zA-Z0-9]{48}/, // OpenAI keys
          /AIza[0-9A-Za-z-_]{35}/, // Google API keys
          /[0-9a-f]{32}/ // Generic 32-char hex keys
        ];
        
        dangerousPatterns.forEach(pattern => {
          expect(content).not.toMatch(pattern);
        });
      }
    });

    it('should not expose service role key in client code', () => {
      const clientFiles = [
        'lib/supabase/client.ts',
        'app/page.tsx'
      ];
      
      clientFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
          expect(content).not.toContain('service_role');
        }
      });
    });

    it('should use environment variables for sensitive data', () => {
      const securityFiles = [
        'lib/supabase/server.ts',
        'lib/ai/gemini.ts',
        'lib/ai/groq.ts',
        'lib/ai/openai.ts'
      ];
      
      securityFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Should use process.env for API keys
          if (content.includes('API') || content.includes('KEY')) {
            expect(content).toContain('process.env');
          }
        }
      });
    });
  });

  describe('RLS Policy Validation', () => {
    it('should have RLS policies defined in schema', () => {
      const schemaPath = path.join(process.cwd(), 'database-schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Check for RLS enablement
        expect(schema).toContain('ENABLE ROW LEVEL SECURITY');
        
        // Check for policies on critical tables
        const criticalTables = ['workflows', 'executions', 'user_settings'];
        criticalTables.forEach(table => {
          expect(schema).toContain(`ON ${table}`);
          expect(schema).toContain('auth.uid()');
        });
        
        // Check for proper policy operations
        const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        operations.forEach(op => {
          expect(schema).toContain(`FOR ${op}`);
        });
      }
    });

    it('should enforce user_id checks in RLS policies', () => {
      const schemaPath = path.join(process.cwd(), 'database-schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // All policies should check user_id
        const policyBlocks = schema.split('CREATE POLICY');
        policyBlocks.slice(1).forEach(block => {
          expect(block).toContain('user_id');
          expect(block).toContain('auth.uid()');
        });
      }
    });
  });

  describe('Configuration Security', () => {
    it('should disable powered-by header in Next.js config', () => {
      const configPath = path.join(process.cwd(), 'next.config.mjs');
      
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, 'utf8');
        
        expect(config).toContain('poweredByHeader: false');
      }
    });

    it('should enable React strict mode', () => {
      const configPath = path.join(process.cwd(), 'next.config.mjs');
      
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, 'utf8');
        
        expect(config).toContain('reactStrictMode: true');
      }
    });

    it('should have security headers in Next.js config', () => {
      const configPath = path.join(process.cwd(), 'next.config.mjs');
      
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, 'utf8');
        
        expect(config).toContain('X-Frame-Options');
        expect(config).toContain('X-Content-Type-Options');
        expect(config).toContain('Referrer-Policy');
      }
    });

    it('should not expose sensitive webpack configuration', () => {
      const configPath = path.join(process.cwd(), 'next.config.mjs');
      
      if (fs.existsSync(configPath)) {
        const config = fs.readFileSync(configPath, 'utf8');
        
        // Should have proper fallbacks for server-only modules
        if (config.includes('webpack')) {
          expect(config).toContain('fs: false');
          expect(config).toContain('net: false');
        }
      }
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should have rate limit configurations defined', () => {
      const { RATE_LIMIT_CONFIGS } = require('@/lib/security/validation');
      
      expect(RATE_LIMIT_CONFIGS.auth).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.ai).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.api).toBeDefined();
    });

    it('should have appropriate rate limits for auth endpoints', () => {
      const { RATE_LIMIT_CONFIGS } = require('@/lib/security/validation');
      
      // Auth should be more restrictive
      expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBeLessThanOrEqual(10);
      expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBeGreaterThanOrEqual(60000); // At least 1 minute
    });

    it('should have appropriate rate limits for AI endpoints', () => {
      const { RATE_LIMIT_CONFIGS } = require('@/lib/security/validation');
      
      // AI should be moderate
      expect(RATE_LIMIT_CONFIGS.ai.maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIGS.ai.maxRequests).toBeLessThanOrEqual(100);
    });
  });
});
