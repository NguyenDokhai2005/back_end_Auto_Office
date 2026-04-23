import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/response';
import { validateRequired, errorResponse } from '@/lib/utils/errors';
import { AIProvider } from '@/lib/ai/adapter';
import { aiRateLimiter } from '@/lib/utils/rateLimit';
import { AIRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await requireAuth();

    // Rate limiting check
    const rateLimit = aiRateLimiter.check(user.id);
    
    if (!rateLimit.allowed) {
      return ApiResponse.rateLimit('Rate limit exceeded. Please try again in a minute.');
    }

    // Parse request body
    const body = await request.json();
    const { prompt, provider = 'gemini', temperature, maxTokens, systemPrompt } = body;

    // Validation
    if (!prompt || typeof prompt !== 'string' || prompt.length === 0) {
      return ApiResponse.badRequest('Prompt must be a non-empty string');
    }

    if (prompt.length > 5000) {
      return ApiResponse.badRequest('Prompt is too long (max 5000 characters)');
    }

    // Validate provider
    const validProviders = ['gemini', 'groq', 'openai'];
    if (!validProviders.includes(provider)) {
      return ApiResponse.badRequest(`Invalid provider. Must be one of: ${validProviders.join(', ')}`);
    }

    // Validate temperature
    if (temperature !== undefined) {
      if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
        return ApiResponse.badRequest('Temperature must be a number between 0 and 1');
      }
    }

    // Validate maxTokens
    if (maxTokens !== undefined) {
      if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 4000) {
        return ApiResponse.badRequest('maxTokens must be a number between 1 and 4000');
      }
    }

    // Build AI request
    const aiRequest: AIRequest = {
      prompt,
      provider: provider as 'gemini' | 'groq' | 'openai',
      temperature,
      maxTokens,
      systemPrompt,
    };

    // Get AI adapter and call
    const adapter = AIProvider.getAdapter(provider);
    const result = await adapter.call(aiRequest);

    // Return response with rate limit headers
    const response = ApiResponse.success(result);
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

    return response;
  } catch (error: any) {
    // Handle specific AI provider errors
    if (error.message?.includes('API key')) {
      return ApiResponse.error('AI service configuration error. Please contact support.', 500);
    }

    if (error.message?.includes('Rate limit exceeded') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return ApiResponse.rateLimit('AI service rate limit exceeded. Please try again later.');
    }

    return errorResponse(error);
  }
}
