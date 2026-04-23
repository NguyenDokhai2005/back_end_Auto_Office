import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAdapter } from './adapter';
import { AIRequest, AIResponse } from '@/types';

export class GeminiAdapter implements AIAdapter {
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async call(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const model = this.client.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 1000,
        },
      });

      // Build prompt with system prompt if provided
      let fullPrompt = request.prompt;
      if (request.systemPrompt) {
        fullPrompt = `${request.systemPrompt}\n\n${request.prompt}`;
      }

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      const duration = (Date.now() - startTime) / 1000;

      return {
        response: text,
        usage: {
          total_tokens: 0, // Gemini doesn't provide token count in free tier
        },
        metadata: {
          model: 'gemini-1.5-pro',
          duration,
        },
      };
    } catch (error: any) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
}
