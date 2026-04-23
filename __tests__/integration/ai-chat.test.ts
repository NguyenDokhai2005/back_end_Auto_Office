import { NextRequest } from 'next/server';
import { POST as aiChatHandler } from '@/app/api/ai/chat/route';
import { aiRateLimiter } from '@/lib/utils/rateLimit';

// Mock AI adapters
const mockGeminiCall = jest.fn();
const mockGroqCall = jest.fn();
const mockOpenAICall = jest.fn();

jest.mock('@/lib/ai/adapter', () => ({
  AIProvider: {
    getAdapter: jest.fn((provider: string) => {
      switch (provider) {
        case 'gemini':
          return { call: mockGeminiCall };
        case 'groq':
          return { call: mockGroqCall };
        case 'openai':
          return { call: mockOpenAICall };
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }
    }),
  },
}));

// Mock authentication
jest.mock('@/lib/supabase/server', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
  })),
}));

describe('AI Chat Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limiter for each test
    aiRateLimiter.reset('user-123');
  });

  describe('Gemini Integration', () => {
    it('should successfully call Gemini API', async () => {
      const mockResponse = {
        response: 'Hello! How can I help you today?',
        usage: { total_tokens: 25 },
        metadata: { model: 'gemini-pro', duration: 1.2 },
      };

      mockGeminiCall.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Hello, how are you?',
          provider: 'gemini',
          temperature: 0.7,
          maxTokens: 100,
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.response).toBe('Hello! How can I help you today?');
      expect(responseData.data.usage.total_tokens).toBe(25);
      expect(responseData.data.metadata.model).toBe('gemini-pro');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('19');
      expect(mockGeminiCall).toHaveBeenCalledWith({
        prompt: 'Hello, how are you?',
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 100,
      });
    });

    it('should handle Gemini API with system prompt', async () => {
      const mockResponse = {
        response: 'As a helpful assistant, I can help you with various tasks.',
        usage: { total_tokens: 30 },
        metadata: { model: 'gemini-pro', duration: 1.5 },
      };

      mockGeminiCall.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'What can you do?',
          provider: 'gemini',
          systemPrompt: 'You are a helpful assistant.',
          temperature: 0.5,
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.response).toContain('helpful assistant');
      expect(mockGeminiCall).toHaveBeenCalledWith({
        prompt: 'What can you do?',
        provider: 'gemini',
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.5,
      });
    });

    it('should handle Gemini API errors', async () => {
      mockGeminiCall.mockRejectedValue(new Error('Gemini API error: Rate limit exceeded'));

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          provider: 'gemini',
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error).toBe('AI service rate limit exceeded. Please try again later.');
      expect(responseData.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should handle Gemini API key errors', async () => {
      mockGeminiCall.mockRejectedValue(new Error('API key is invalid'));

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          provider: 'gemini',
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('AI service configuration error. Please contact support.');
    });
  });

  describe('Groq Integration', () => {
    it('should successfully call Groq API', async () => {
      const mockResponse = {
        response: 'This is a response from Groq.',
        usage: { total_tokens: 20 },
        metadata: { model: 'mixtral-8x7b-32768', duration: 0.8 },
      };

      mockGroqCall.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Generate a short response',
          provider: 'groq',
          temperature: 0.3,
          maxTokens: 50,
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.response).toBe('This is a response from Groq.');
      expect(responseData.data.usage.total_tokens).toBe(20);
      expect(responseData.data.metadata.model).toBe('mixtral-8x7b-32768');
      expect(mockGroqCall).toHaveBeenCalledWith({
        prompt: 'Generate a short response',
        provider: 'groq',
        temperature: 0.3,
        maxTokens: 50,
      });
    });
  });

  describe('OpenAI Integration', () => {
    it('should successfully call OpenAI API', async () => {
      const mockResponse = {
        response: 'This is a response from OpenAI.',
        usage: { total_tokens: 35 },
        metadata: { model: 'gpt-3.5-turbo', duration: 2.1 },
      };

      mockOpenAICall.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Explain machine learning briefly',
          provider: 'openai',
          temperature: 0.8,
          maxTokens: 200,
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.response).toBe('This is a response from OpenAI.');
      expect(responseData.data.usage.total_tokens).toBe(35);
      expect(responseData.data.metadata.model).toBe('gpt-3.5-turbo');
      expect(mockOpenAICall).toHaveBeenCalledWith({
        prompt: 'Explain machine learning briefly',
        provider: 'openai',
        temperature: 0.8,
        maxTokens: 200,
      });
    });
  });

  describe('Request Validation', () => {
    it('should validate required prompt field', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'gemini',
          temperature: 0.7,
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Prompt must be a non-empty string');
    });

    it('should validate prompt is non-empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: '',
          provider: 'gemini',
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Prompt must be a non-empty string');
    });

    it('should validate prompt length limit', async () => {
      const longPrompt = 'a'.repeat(5001);

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: longPrompt,
          provider: 'gemini',
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Prompt is too long (max 5000 characters)');
    });

    it('should validate provider', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          provider: 'invalid-provider',
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid provider. Must be one of: gemini, groq, openai');
    });

    it('should validate temperature range', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          provider: 'gemini',
          temperature: 1.5, // Invalid: > 1
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Temperature must be a number between 0 and 1');
    });

    it('should validate maxTokens range', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          provider: 'gemini',
          maxTokens: 5000, // Invalid: > 4000
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('maxTokens must be a number between 1 and 4000');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const mockResponse = {
        response: 'Test response',
        usage: { total_tokens: 10 },
        metadata: { model: 'gemini-pro', duration: 1.0 },
      };

      mockGeminiCall.mockResolvedValue(mockResponse);

      // Make 20 requests (the limit)
      for (let i = 0; i < 20; i++) {
        const request = new NextRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            prompt: `Test prompt ${i}`,
            provider: 'gemini',
          }),
        });

        const response = await aiChatHandler(request);
        expect(response.status).toBe(200);
      }

      // 21st request should be rate limited
      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'This should be rate limited',
          provider: 'gemini',
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error).toBe('Rate limit exceeded. Please try again in a minute.');
      expect(responseData.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should include rate limit headers', async () => {
      const mockResponse = {
        response: 'Test response',
        usage: { total_tokens: 10 },
        metadata: { model: 'gemini-pro', duration: 1.0 },
      };

      mockGeminiCall.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          provider: 'gemini',
        }),
      });

      const response = await aiChatHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('19');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('Provider Switching', () => {
    it('should handle switching between providers', async () => {
      const geminiResponse = {
        response: 'Gemini response',
        usage: { total_tokens: 15 },
        metadata: { model: 'gemini-pro', duration: 1.2 },
      };

      const groqResponse = {
        response: 'Groq response',
        usage: { total_tokens: 18 },
        metadata: { model: 'mixtral-8x7b-32768', duration: 0.9 },
      };

      mockGeminiCall.mockResolvedValue(geminiResponse);
      mockGroqCall.mockResolvedValue(groqResponse);

      // Test Gemini
      const geminiRequest = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test with Gemini',
          provider: 'gemini',
        }),
      });

      const geminiResponseResult = await aiChatHandler(geminiRequest);
      const geminiData = await geminiResponseResult.json();

      expect(geminiResponseResult.status).toBe(200);
      expect(geminiData.data.response).toBe('Gemini response');
      expect(geminiData.data.metadata.model).toBe('gemini-pro');

      // Test Groq
      const groqRequest = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test with Groq',
          provider: 'groq',
        }),
      });

      const groqResponseResult = await aiChatHandler(groqRequest);
      const groqData = await groqResponseResult.json();

      expect(groqResponseResult.status).toBe(200);
      expect(groqData.data.response).toBe('Groq response');
      expect(groqData.data.metadata.model).toBe('mixtral-8x7b-32768');
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      // Mock authentication failure
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockRejectedValueOnce(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          provider: 'gemini',
        }),
      });

      const response = await aiChatHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
  });
});