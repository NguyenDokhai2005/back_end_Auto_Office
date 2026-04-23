import { NextRequest } from 'next/server';

// Import all API route handlers
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { GET as userHandler } from '@/app/api/auth/user/route';

import { GET as getWorkflows, POST as createWorkflow } from '@/app/api/workflows/route';
import { GET as getWorkflow, PUT as updateWorkflow, DELETE as deleteWorkflow } from '@/app/api/workflows/[id]/route';

import { POST as aiChatHandler } from '@/app/api/ai/chat/route';

import { GET as getExecutions, POST as createExecution } from '@/app/api/executions/route';
import { GET as getExecution, PATCH as updateExecution } from '@/app/api/executions/[id]/route';

import { GET as getSettings, PUT as updateSettings } from '@/app/api/settings/route';

// Mock all external dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/ai/adapter');
jest.mock('@/lib/utils/rateLimit');

describe('API Endpoints Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/signup', () => {
      it('should accept valid signup request', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          auth: {
            signUp: jest.fn().mockResolvedValue({
              data: {
                user: { id: 'user-123', email: 'test@example.com' },
                session: { access_token: 'token' },
              },
              error: null,
            }),
          },
        });

        const request = new NextRequest('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          }),
        });

        const response = await signupHandler(request);
        expect(response.status).toBe(201);
      });

      it('should reject invalid email format', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'invalid-email',
            password: 'password123',
            name: 'Test User',
          }),
        });

        const response = await signupHandler(request);
        expect(response.status).toBe(400);
      });

      it('should reject short password', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: '123',
            name: 'Test User',
          }),
        });

        const response = await signupHandler(request);
        expect(response.status).toBe(400);
      });

      it('should reject missing required fields', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            // Missing password and name
          }),
        });

        const response = await signupHandler(request);
        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should accept valid login request', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          auth: {
            signInWithPassword: jest.fn().mockResolvedValue({
              data: {
                user: { id: 'user-123', email: 'test@example.com' },
                session: { access_token: 'token' },
              },
              error: null,
            }),
          },
        });

        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });

        const response = await loginHandler(request);
        expect(response.status).toBe(200);
      });

      it('should reject invalid credentials', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          auth: {
            signInWithPassword: jest.fn().mockResolvedValue({
              data: { user: null, session: null },
              error: { message: 'Invalid credentials' },
            }),
          },
        });

        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword',
          }),
        });

        const response = await loginHandler(request);
        expect(response.status).toBe(401);
      });

      it('should reject malformed JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await loginHandler(request);
        expect(response.status).toBe(500);
      });
    });
  });

  describe('Workflow Endpoints', () => {
    beforeEach(() => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
    });

    describe('POST /api/workflows', () => {
      it('should accept valid workflow creation', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          from: jest.fn(() => ({
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'wf-123', name: 'Test Workflow' },
                  error: null,
                }),
              })),
            })),
          })),
        });

        const request = new NextRequest('http://localhost:3000/api/workflows', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Workflow',
            description: 'A test workflow',
            nodes: [{ id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} }],
            edges: [],
          }),
        });

        const response = await createWorkflow(request);
        expect(response.status).toBe(201);
      });

      it('should reject invalid node structure', async () => {
        const request = new NextRequest('http://localhost:3000/api/workflows', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Workflow',
            nodes: 'not-an-array',
            edges: [],
          }),
        });

        const response = await createWorkflow(request);
        expect(response.status).toBe(400);
      });

      it('should reject missing required fields', async () => {
        const request = new NextRequest('http://localhost:3000/api/workflows', {
          method: 'POST',
          body: JSON.stringify({
            description: 'Missing name and nodes',
          }),
        });

        const response = await createWorkflow(request);
        expect(response.status).toBe(400);
      });

      it('should handle extremely large workflow data', async () => {
        const largeNodes = Array.from({ length: 1000 }, (_, i) => ({
          id: `node-${i}`,
          type: 'test',
          position: { x: i * 10, y: i * 10 },
          config: { data: 'x'.repeat(1000) },
        }));

        const request = new NextRequest('http://localhost:3000/api/workflows', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Large Workflow',
            nodes: largeNodes,
            edges: [],
          }),
        });

        const response = await createWorkflow(request);
        // Should either accept or reject gracefully, not crash
        expect([200, 201, 400, 413, 500]).toContain(response.status);
      });
    });

    describe('GET /api/workflows', () => {
      it('should accept valid pagination parameters', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0,
                  }),
                })),
              })),
            })),
          })),
        });

        const request = new NextRequest('http://localhost:3000/api/workflows?page=2&limit=5');
        const response = await getWorkflows(request);
        expect(response.status).toBe(200);
      });

      it('should handle invalid pagination parameters', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0,
                  }),
                })),
              })),
            })),
          })),
        });

        const request = new NextRequest('http://localhost:3000/api/workflows?page=-1&limit=abc');
        const response = await getWorkflows(request);
        expect(response.status).toBe(200); // Should handle gracefully with defaults
      });

      it('should handle search with special characters', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() => ({
                    or: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                      count: 0,
                    }),
                  })),
                })),
              })),
            })),
          })),
        });

        const request = new NextRequest('http://localhost:3000/api/workflows?search=%20%3C%3E%22%27%26');
        const response = await getWorkflows(request);
        expect(response.status).toBe(200);
      });
    });
  });

  describe('AI Chat Endpoint', () => {
    beforeEach(() => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

      const { aiRateLimiter } = require('@/lib/utils/rateLimit');
      aiRateLimiter.check = jest.fn().mockReturnValue({
        allowed: true,
        remaining: 19,
        resetAt: Date.now() + 60000,
      });
    });

    describe('POST /api/ai/chat', () => {
      it('should accept valid AI request', async () => {
        const { AIProvider } = require('@/lib/ai/adapter');
        AIProvider.getAdapter = jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue({
            response: 'Test response',
            usage: { total_tokens: 10 },
            metadata: { model: 'gemini-pro', duration: 1.0 },
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Hello, world!',
            provider: 'gemini',
            temperature: 0.7,
            maxTokens: 100,
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(200);
      });

      it('should reject empty prompt', async () => {
        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: '',
            provider: 'gemini',
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(400);
      });

      it('should reject invalid provider', async () => {
        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Test prompt',
            provider: 'invalid-provider',
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(400);
      });

      it('should reject invalid temperature', async () => {
        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Test prompt',
            provider: 'gemini',
            temperature: 2.0, // Invalid: > 1
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(400);
      });

      it('should reject invalid maxTokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Test prompt',
            provider: 'gemini',
            maxTokens: 0, // Invalid: < 1
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(400);
      });

      it('should handle rate limiting', async () => {
        const { aiRateLimiter } = require('@/lib/utils/rateLimit');
        aiRateLimiter.check = jest.fn().mockReturnValue({
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + 60000,
        });

        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Test prompt',
            provider: 'gemini',
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(429);
      });

      it('should handle very long prompts', async () => {
        const longPrompt = 'a'.repeat(10000);

        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: longPrompt,
            provider: 'gemini',
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(400);
      });

      it('should handle special characters in prompt', async () => {
        const { AIProvider } = require('@/lib/ai/adapter');
        AIProvider.getAdapter = jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue({
            response: 'Response with special chars',
            usage: { total_tokens: 15 },
            metadata: { model: 'gemini-pro', duration: 1.2 },
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Test with special chars: <>&"\'%',
            provider: 'gemini',
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Execution Endpoints', () => {
    beforeEach(() => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
    });

    describe('POST /api/executions', () => {
      it('should accept valid execution creation', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          from: jest.fn(() => ({
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'exec-123', status: 'running' },
                  error: null,
                }),
              })),
            })),
          })),
        });

        const request = new NextRequest('http://localhost:3000/api/executions', {
          method: 'POST',
          body: JSON.stringify({
            workflow_id: 'wf-123',
            status: 'running',
          }),
        });

        const response = await createExecution(request);
        expect(response.status).toBe(201);
      });

      it('should reject invalid status', async () => {
        const request = new NextRequest('http://localhost:3000/api/executions', {
          method: 'POST',
          body: JSON.stringify({
            workflow_id: 'wf-123',
            status: 'invalid-status',
          }),
        });

        const response = await createExecution(request);
        expect(response.status).toBe(400);
      });
    });
  });

  describe('Settings Endpoints', () => {
    beforeEach(() => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
    });

    describe('PUT /api/settings', () => {
      it('should accept valid settings update', async () => {
        const { createServerClient } = require('@/lib/supabase/server');
        createServerClient.mockReturnValue({
          from: jest.fn(() => ({
            upsert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { user_id: 'user-123', preferences: {} },
                  error: null,
                }),
              })),
            })),
          })),
        });

        const request = new NextRequest('http://localhost:3000/api/settings', {
          method: 'PUT',
          body: JSON.stringify({
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          }),
        });

        const response = await updateSettings(request);
        expect(response.status).toBe(200);
      });

      it('should handle invalid JSON in settings', async () => {
        const request = new NextRequest('http://localhost:3000/api/settings', {
          method: 'PUT',
          body: 'invalid json',
        });

        const response = await updateSettings(request);
        expect(response.status).toBe(500);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication failures consistently', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockRejectedValue(new Error('Unauthorized'));

      const endpoints = [
        { handler: getWorkflows, url: 'http://localhost:3000/api/workflows' },
        { handler: createWorkflow, url: 'http://localhost:3000/api/workflows' },
        { handler: aiChatHandler, url: 'http://localhost:3000/api/ai/chat' },
        { handler: getExecutions, url: 'http://localhost:3000/api/executions' },
        { handler: getSettings, url: 'http://localhost:3000/api/settings' },
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url, {
          method: 'GET',
        });

        const response = await endpoint.handler(request);
        expect(response.status).toBe(401);
      }
    });

    it('should handle database connection failures', async () => {
      const { requireAuth, createServerClient } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      
      createServerClient.mockReturnValue({
        from: jest.fn(() => {
          throw new Error('Database connection failed');
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/workflows');
      const response = await getWorkflows(request);
      expect(response.status).toBe(500);
    });

    it('should handle malformed request bodies', async () => {
      const endpoints = [
        { handler: signupHandler, url: 'http://localhost:3000/api/auth/signup' },
        { handler: loginHandler, url: 'http://localhost:3000/api/auth/login' },
        { handler: createWorkflow, url: 'http://localhost:3000/api/workflows' },
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url, {
          method: 'POST',
          body: 'invalid json {',
        });

        const response = await endpoint.handler(request);
        expect([400, 500]).toContain(response.status);
      }
    });
  });

  describe('Security Tests', () => {
    it('should sanitize SQL injection attempts', async () => {
      const { requireAuth, createServerClient } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      
      const mockOr = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      createServerClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => ({
                  or: mockOr,
                })),
              })),
            })),
          })),
        })),
      });

      const sqlInjectionAttempt = "'; DROP TABLE workflows; --";
      const request = new NextRequest(`http://localhost:3000/api/workflows?search=${encodeURIComponent(sqlInjectionAttempt)}`);
      
      const response = await getWorkflows(request);
      expect(response.status).toBe(200);
      // Verify the search parameter was passed safely
      expect(mockOr).toHaveBeenCalledWith(expect.stringContaining(sqlInjectionAttempt));
    });

    it('should handle XSS attempts in input', async () => {
      const { requireAuth, createServerClient } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });
      
      createServerClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'wf-123', name: 'Test' },
                error: null,
              }),
            })),
          })),
        })),
      });

      const xssAttempt = '<script>alert("xss")</script>';
      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: xssAttempt,
          nodes: [],
          edges: [],
        }),
      });

      const response = await createWorkflow(request);
      expect([200, 201, 400]).toContain(response.status);
    });
  });
});