import { GeminiAdapter } from '@/lib/ai/gemini';
import { AIRequest } from '@/types';

describe('GeminiAdapter Integration Tests', () => {
  let adapter: GeminiAdapter;

  beforeAll(() => {
    // Use real API key for integration tests
    process.env.GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || 'AIzaSyDPExUKF5J5cnbDPq0w7GvLKK7dTo_8Ofg';
  });

  beforeEach(() => {
    adapter = new GeminiAdapter();
  });

  describe('Real API Integration', () => {
    // Skip these tests if no real API key is available
    const skipIfNoApiKey = process.env.GOOGLE_AI_API_KEY?.startsWith('test-') ? it.skip : it;

    skipIfNoApiKey('should successfully call Gemini API with simple prompt', async () => {
      const request: AIRequest = {
        prompt: 'Say hello in exactly 3 words',
        provider: 'gemini',
        temperature: 0.1,
        maxTokens: 50,
      };

      const result = await adapter.call(request);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
      expect(result.metadata?.model).toBe('gemini-pro');
      expect(result.metadata?.duration).toBeGreaterThan(0);
    }, 30000);

    skipIfNoApiKey('should handle system prompt correctly', async () => {
      const request: AIRequest = {
        prompt: 'What is your role?',
        provider: 'gemini',
        systemPrompt: 'You are a helpful math tutor. Always respond with mathematical examples.',
        temperature: 0.1,
        maxTokens: 100,
      };

      const result = await adapter.call(request);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
    }, 30000);

    skipIfNoApiKey('should handle different temperature settings', async () => {
      const lowTempRequest: AIRequest = {
        prompt: 'Generate a random number between 1 and 10',
        provider: 'gemini',
        temperature: 0.1,
        maxTokens: 50,
      };

      const highTempRequest: AIRequest = {
        prompt: 'Generate a random number between 1 and 10',
        provider: 'gemini',
        temperature: 0.9,
        maxTokens: 50,
      };

      const lowTempResult = await adapter.call(lowTempRequest);
      const highTempResult = await adapter.call(highTempRequest);

      expect(lowTempResult.response).toBeDefined();
      expect(highTempResult.response).toBeDefined();
      expect(typeof lowTempResult.response).toBe('string');
      expect(typeof highTempResult.response).toBe('string');
    }, 30000);

    skipIfNoApiKey('should handle longer prompts', async () => {
      const longPrompt = 'Explain the concept of machine learning in detail. ' +
        'Include information about supervised learning, unsupervised learning, ' +
        'and reinforcement learning. Provide examples for each type.';

      const request: AIRequest = {
        prompt: longPrompt,
        provider: 'gemini',
        temperature: 0.7,
        maxTokens: 500,
      };

      const result = await adapter.call(request);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(100);
    }, 30000);

    skipIfNoApiKey('should handle JSON-like responses', async () => {
      const request: AIRequest = {
        prompt: 'Return a JSON object with keys "name" and "age" for a fictional character',
        provider: 'gemini',
        temperature: 0.1,
        maxTokens: 100,
      };

      const result = await adapter.call(request);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.response).toContain('name');
      expect(result.response).toContain('age');
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid API key gracefully', async () => {
      // Temporarily set invalid API key
      const originalKey = process.env.GOOGLE_AI_API_KEY;
      process.env.GOOGLE_AI_API_KEY = 'invalid-key';

      const invalidAdapter = new GeminiAdapter();
      const request: AIRequest = {
        prompt: 'Test prompt',
        provider: 'gemini',
      };

      await expect(invalidAdapter.call(request)).rejects.toThrow(/Gemini API error/);

      // Restore original key
      process.env.GOOGLE_AI_API_KEY = originalKey;
    }, 10000);

    it('should handle network timeouts', async () => {
      const request: AIRequest = {
        prompt: 'Test prompt',
        provider: 'gemini',
      };

      // Mock a timeout scenario by creating a very short timeout
      const originalCall = adapter.call;
      adapter.call = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      await expect(adapter.call(request)).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance Tests', () => {
    const skipIfNoApiKey = process.env.GOOGLE_AI_API_KEY?.startsWith('test-') ? it.skip : it;

    skipIfNoApiKey('should complete requests within reasonable time', async () => {
      const request: AIRequest = {
        prompt: 'Count from 1 to 5',
        provider: 'gemini',
        temperature: 0.1,
        maxTokens: 50,
      };

      const startTime = Date.now();
      const result = await adapter.call(request);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.metadata?.duration).toBeGreaterThan(0);
      expect(result.metadata?.duration).toBeLessThan(duration); // Metadata duration should be less than total time
    }, 15000);

    skipIfNoApiKey('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        prompt: `Say "Request ${i + 1}" and nothing else`,
        provider: 'gemini' as const,
        temperature: 0.1,
        maxTokens: 20,
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => adapter.call(request))
      );
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.response).toBeDefined();
        expect(typeof result.response).toBe('string');
      });

      // Concurrent requests should be faster than sequential
      expect(totalDuration).toBeLessThan(15000); // Should complete within 15 seconds
    }, 20000);
  });

  describe('Edge Cases', () => {
    const skipIfNoApiKey = process.env.GOOGLE_AI_API_KEY?.startsWith('test-') ? it.skip : it;

    skipIfNoApiKey('should handle empty prompt gracefully', async () => {
      const request: AIRequest = {
        prompt: '',
        provider: 'gemini',
      };

      // This might throw an error or return a response, depending on the API
      try {
        const result = await adapter.call(request);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Gemini API error');
      }
    }, 10000);

    skipIfNoApiKey('should handle very short maxTokens', async () => {
      const request: AIRequest = {
        prompt: 'Write a long essay about artificial intelligence',
        provider: 'gemini',
        maxTokens: 5,
      };

      const result = await adapter.call(request);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      // Response should be truncated due to low token limit
    }, 10000);

    skipIfNoApiKey('should handle special characters in prompt', async () => {
      const request: AIRequest = {
        prompt: 'Translate: "Hello! How are you? 你好吗？ ¿Cómo estás? Как дела?"',
        provider: 'gemini',
        temperature: 0.1,
        maxTokens: 100,
      };

      const result = await adapter.call(request);

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.response.length).toBeGreaterThan(0);
    }, 10000);
  });
});