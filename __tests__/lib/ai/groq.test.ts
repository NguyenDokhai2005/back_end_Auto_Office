import { GroqAdapter } from '@/lib/ai/groq';
import { AIRequest } from '@/types';

// Mock the Groq SDK
const mockCreate = jest.fn();
jest.mock('groq-sdk', () => {
  return jest.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('GroqAdapter', () => {
  let adapter: GroqAdapter;

  beforeEach(() => {
    // Set up environment variable
    process.env.GROQ_API_KEY = 'test-api-key';
    jest.clearAllMocks();
    adapter = new GroqAdapter();
  });

  describe('constructor', () => {
    it('should throw error when API key is not configured', () => {
      delete process.env.GROQ_API_KEY;
      
      expect(() => {
        new GroqAdapter();
      }).toThrow('GROQ_API_KEY is not configured');
      
      // Restore for other tests
      process.env.GROQ_API_KEY = 'test-api-key';
    });

    it('should initialize successfully with API key', () => {
      expect(() => {
        new GroqAdapter();
      }).not.toThrow();
    });
  });

  describe('call', () => {
    const mockRequest: AIRequest = {
      prompt: 'Test prompt',
      provider: 'groq',
      temperature: 0.7,
      maxTokens: 1000,
    };

    it('should successfully call Groq API', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };
      
      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.call(mockRequest);

      expect(result).toEqual({
        response: 'Test response',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        metadata: {
          model: 'llama3-70b-8192',
          duration: expect.any(Number),
        },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should include system message when system prompt is provided', async () => {
      const requestWithSystem: AIRequest = {
        ...mockRequest,
        systemPrompt: 'You are a helpful assistant',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 20,
          total_tokens: 35,
        },
      };
      
      mockCreate.mockResolvedValue(mockResponse);

      await adapter.call(requestWithSystem);

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant',
          },
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should use default values for temperature and maxTokens', async () => {
      const requestWithoutParams: AIRequest = {
        prompt: 'Test prompt',
        provider: 'groq',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        usage: {
          total_tokens: 30,
        },
      };
      
      mockCreate.mockResolvedValue(mockResponse);

      await adapter.call(requestWithoutParams);

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'user',
            content: 'Test prompt',
          },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [],
        usage: {
          total_tokens: 10,
        },
      };
      
      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.call(mockRequest);

      expect(result.response).toBe('');
    });

    it('should handle API errors', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockCreate.mockRejectedValue(apiError);

      await expect(adapter.call(mockRequest)).rejects.toThrow(
        'Groq API error: API rate limit exceeded'
      );
    });

    it('should measure execution duration', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
        usage: {
          total_tokens: 30,
        },
      };
      
      mockCreate.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });

      const result = await adapter.call(mockRequest);

      expect(result.metadata?.duration).toBeGreaterThan(0.05); // At least 50ms
    });
  });
});