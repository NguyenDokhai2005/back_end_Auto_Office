import { RateLimitError } from '@/types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  private limit: number;
  private windowMs: number;
  private rateLimits: Map<string, RateLimitEntry>;

  constructor(limit: number = 20, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.rateLimits = new Map<string, RateLimitEntry>();
  }

  check(userId: string): RateLimitResult {
    const now = Date.now();
    const entry = this.rateLimits.get(userId);

    // Reset if window expired
    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.rateLimits.set(userId, {
        count: 1,
        resetAt,
      });
      return {
        allowed: true,
        remaining: this.limit - 1,
        resetAt,
      };
    }

    // Check limit
    if (entry.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: this.limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  reset(userId: string): void {
    this.rateLimits.delete(userId);
  }

  // Clean up expired entries (call periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.rateLimits.entries()) {
      if (now > entry.resetAt) {
        this.rateLimits.delete(userId);
      }
    }
  }
}

// Default rate limiter for AI endpoints (20 requests per minute)
export const aiRateLimiter = new RateLimiter(20, 60000);

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    aiRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
