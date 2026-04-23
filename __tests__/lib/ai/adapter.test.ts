import { AIProvider } from '@/lib/ai/adapter';

describe('AIProvider', () => {
  describe('getAdapter', () => {
    it('should return adapter for gemini provider', () => {
      const adapter = AIProvider.getAdapter('gemini');
      expect(adapter).toBeDefined();
      expect(adapter.constructor.name).toBe('GeminiAdapter');
    });

    it('should return adapter for groq provider', () => {
      const adapter = AIProvider.getAdapter('groq');
      expect(adapter).toBeDefined();
      expect(adapter.constructor.name).toBe('GroqAdapter');
    });

    it('should return adapter for openai provider', () => {
      const adapter = AIProvider.getAdapter('openai');
      expect(adapter).toBeDefined();
      expect(adapter.constructor.name).toBe('OpenAIAdapter');
    });

    it('should throw error for unknown provider', () => {
      expect(() => {
        AIProvider.getAdapter('unknown');
      }).toThrow('Unknown AI provider: unknown');
    });

    it('should throw error for empty provider', () => {
      expect(() => {
        AIProvider.getAdapter('');
      }).toThrow('Unknown AI provider: ');
    });
  });
});