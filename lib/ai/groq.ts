import Groq from 'groq-sdk';
import { AIAdapter } from './adapter';
import { AIRequest, AIResponse } from '@/types';

export class GroqAdapter implements AIAdapter {
  private client: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    this.client = new Groq({ apiKey });
  }

  async call(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const messages: any[] = [];

      // Add system message if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const completion = await this.client.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
      });

      const duration = (Date.now() - startTime) / 1000;

      return {
        response: completion.choices[0]?.message?.content || '',
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens,
          completion_tokens: completion.usage?.completion_tokens,
          total_tokens: completion.usage?.total_tokens,
        },
        metadata: {
          model: 'llama-3.3-70b-versatile',
          duration,
        },
      };
    } catch (error: any) {
      throw new Error(`Groq API error: ${error.message}`);
    }
  }
}
