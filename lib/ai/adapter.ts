import { AIRequest, AIResponse } from '@/types';

// Base AI Adapter interface
export interface AIAdapter {
  call(request: AIRequest): Promise<AIResponse>;
}

// AI Provider factory
export class AIProvider {
  static getAdapter(provider: string): AIAdapter {
    switch (provider) {
      case 'gemini':
        return new GeminiAdapter();
      case 'groq':
        return new GroqAdapter();
      case 'openai':
        return new OpenAIAdapter();
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }
}

// Import adapters
import { GeminiAdapter } from './gemini';
import { GroqAdapter } from './groq';
import { OpenAIAdapter } from './openai';
