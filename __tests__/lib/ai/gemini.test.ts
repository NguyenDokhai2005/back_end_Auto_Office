import { GeminiAdapter } from '@/lib/ai/gemini';
import { AIRequest } from '@/types';

// Mock the Google Generative AI
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;

  beforeEach(() => {
    // Set up environment variable
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
    jest.clearAllMocks();
    adapter = new GeminiAdapter();
  });

  describe('constructor', () => {
    it('should throw error when API key is not configured', () => {
      delete process.env.GOOGLE_AI_API_KEY;
      
      expect(() => {
        new GeminiAdapter();
      }).toThrow('GOOGLE_AI_API_KEY is not configured');
      
      // Restore for other tests
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';
    });

    it('should initialize successfully with API key', () => {
      expect(() => {
        new GeminiAdapter();
      }).not.toThrow();
    });
  });

  describe('call', () => {
    const mockRequest: AIRequest = {
      prompt: 'Test prompt',
      provider: 'gemini',
      temperature: 0.7,
      maxTokens: 1000,
    };

    it('should successfully call Gemini API', async () => {
      const mockResponse = {
        response: {
          text: () => 'Test response',
        },
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await adapter.call(mockRequest);

      expect(result).toEqual({
        response: 'Test response',
        usage: {
          total_tokens: 0,
        },
        metadata: {
          model: 'gemini-pro',
          duration: expect.any(Number),
        },
      });

      expect(mockGenerateContent).toHaveBeenCalledWith('Test prompt');
    });

    it('should include system prompt when provided', async () => {
      const requestWithSystem: AIRequest = {
        ...mockRequest,
        systemPrompt: 'You are a helpful assistant',
      };

      const mockResponse = {
        response: {
          text: () => 'Test response',
        },
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      await adapter.call(requestWithSystem);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        'You are a helpful assistant\n\nTest prompt'
      );
    });

    it('should use default values for temperature and maxTokens', async () => {
      const requestWithoutParams: AIRequest = {
        prompt: 'Test prompt',
        provider: 'gemini',
      };

      const mockResponse = {
        response: {
          text: () => 'Test response',
        },
      };
      
      mockGenerateContent.mockResolvedValue(mockResponse);

      await adapter.call(requestWithoutParams);

      // Verify the model was created with default values
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });
    });

    it('should handle API errors', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockGenerateContent.mockRejectedValue(apiError);

      await expect(adapter.call(mockRequest)).rejects.toThrow(
        'Gemini API error: API rate limit exceeded'
      );
    });

    it('should measure execution duration', async () => {
      const mockResponse = {
        response: {
          text: () => 'Test response',
        },
      };
      
      mockGenerateContent.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });

      const result = await adapter.call(mockRequest);

      expect(result.metadata?.duration).toBeGreaterThan(0.05); // At least 50ms
    });
  });
});