import { OpenAIAdapter } from '@/lib/ai/openai';
import { AIRequest } from '@/types';

// Mock the OpenAI SDK
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
    jest.clearAllMocks();
    adapter = new OpenAIAdapter();
  });

  describe('constructor', () => {
    it('should throw error when API key is not configured', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(() => {
        new OpenAIAdapter();
      }).toThrow('OPENAI_API_KEY is not configured');
      
      // Restore for other tests
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    it('should initialize successfully with API key', () => {
      expect(() => {
        new OpenAIAdapter();
      }).not.toThrow();
    });
  });

  describe('call', () => {
    const mockRequest: AIRequest = {
      prompt: 'Test prompt',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 1000,
    };

    it('should successfully call OpenAI API', async () => {
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
          model: 'gpt-3.5-turbo',
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
        model: 'gpt-3.5-turbo',
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
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should use default values for temperature and maxTokens', async () => {
      const requestWithoutParams: AIRequest = {
        prompt: 'Test prompt',
        provider: 'openai',
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
        model: 'gpt-3.5-turbo',
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
        'OpenAI API error: API rate limit exceeded'
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