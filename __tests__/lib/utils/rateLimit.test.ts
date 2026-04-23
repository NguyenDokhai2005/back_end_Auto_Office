import { RateLimiter, aiRateLimiter } from '@/lib/utils/rateLimit';

describe('RateLimiter', () => {
  describe('constructor', () => {
    it('should create rate limiter with default values', () => {
      const defaultLimiter = new RateLimiter();
      expect(defaultLimiter).toBeInstanceOf(RateLimiter);
    });

    it('should create rate limiter with custom values', () => {
      const customLimiter = new RateLimiter(10, 30000);
      expect(customLimiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('check', () => {
    it('should allow first request', () => {
      const rateLimiter = new RateLimiter(5, 60000);
      const result = rateLimiter.check('user1');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should track multiple requests for same user', () => {
      const rateLimiter = new RateLimiter(5, 60000);
      
      // First request
      let result = rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      // Second request
      result = rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);

      // Third request
      result = rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should track requests separately for different users', () => {
      const rateLimiter = new RateLimiter(5, 60000);
      
      // User 1 makes requests
      let result1 = rateLimiter.check('user1');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      result1 = rateLimiter.check('user1');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(3);

      // User 2 makes first request
      const result2 = rateLimiter.check('user2');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);

      // User 1 should still have 2 remaining
      result1 = rateLimiter.check('user1');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);
    });

    it('should block requests when limit is exceeded', () => {
      const rateLimiter = new RateLimiter(3, 60000); // Lower limit for easier testing
      const userId = 'user1';

      // Make 3 requests (the limit)
      for (let i = 0; i < 3; i++) {
        const result = rateLimiter.check(userId);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const result = rateLimiter.check(userId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset window after expiry', async () => {
      const shortLimiter = new RateLimiter(2, 100); // 2 requests per 100ms
      const userId = 'user1';

      // Make 2 requests (the limit)
      let result = shortLimiter.check(userId);
      expect(result.allowed).toBe(true);
      
      result = shortLimiter.check(userId);
      expect(result.allowed).toBe(true);

      // 3rd request should be blocked
      result = shortLimiter.check(userId);
      expect(result.allowed).toBe(false);

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow requests again
      result = shortLimiter.check(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should return consistent resetAt time within same window', () => {
      const rateLimiter = new RateLimiter(5, 60000);
      const userId = 'user1';

      const result1 = rateLimiter.check(userId);
      const result2 = rateLimiter.check(userId);

      expect(result1.resetAt).toBe(result2.resetAt);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for specific user', () => {
      const rateLimiter = new RateLimiter(5, 60000);
      const userId = 'user1';

      // Make some requests
      rateLimiter.check(userId);
      rateLimiter.check(userId);
      rateLimiter.check(userId);

      // Reset the user
      rateLimiter.reset(userId);

      // Should start fresh
      const result = rateLimiter.check(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should not affect other users when resetting', () => {
      const rateLimiter = new RateLimiter(5, 60000);
      
      // User 1 makes requests
      rateLimiter.check('user1');
      rateLimiter.check('user1');

      // User 2 makes requests
      rateLimiter.check('user2');
      rateLimiter.check('user2');
      rateLimiter.check('user2');

      // Reset user 1
      rateLimiter.reset('user1');

      // User 1 should start fresh
      const result1 = rateLimiter.check('user1');
      expect(result1.remaining).toBe(4);

      // User 2 should be unaffected
      const result2 = rateLimiter.check('user2');
      expect(result2.remaining).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const shortLimiter = new RateLimiter(5, 100); // 100ms window
      
      // Make requests for multiple users
      shortLimiter.check('user1');
      shortLimiter.check('user2');
      shortLimiter.check('user3');

      // Wait for entries to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Run cleanup
      shortLimiter.cleanup();

      // All users should start fresh after cleanup
      const result1 = shortLimiter.check('user1');
      const result2 = shortLimiter.check('user2');
      const result3 = shortLimiter.check('user3');

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
      expect(result3.remaining).toBe(4);
    });

    it('should not remove non-expired entries', () => {
      const rateLimiter = new RateLimiter(5, 60000);
      
      // Make requests
      rateLimiter.check('user1');
      rateLimiter.check('user1');
      rateLimiter.check('user2');

      // Run cleanup immediately (entries should not be expired)
      rateLimiter.cleanup();

      // Users should maintain their state
      const result1 = rateLimiter.check('user1');
      const result2 = rateLimiter.check('user2');

      expect(result1.remaining).toBe(2); // Had 2 requests, now 3rd
      expect(result2.remaining).toBe(3); // Had 1 request, now 2nd
    });
  });

  describe('aiRateLimiter', () => {
    it('should be configured with correct defaults', () => {
      expect(aiRateLimiter).toBeInstanceOf(RateLimiter);
      
      // Test the default configuration (20 requests per minute)
      const userId = 'test-user-' + Date.now(); // Unique user to avoid conflicts
      
      // Make 20 requests (should all be allowed)
      for (let i = 0; i < 20; i++) {
        const result = aiRateLimiter.check(userId);
        expect(result.allowed).toBe(true);
      }

      // 21st request should be blocked
      const result = aiRateLimiter.check(userId);
      expect(result.allowed).toBe(false);
      
      // Clean up
      aiRateLimiter.reset(userId);
    });
  });
});