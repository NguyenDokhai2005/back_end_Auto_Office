/**
 * Caching utilities for API responses and data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

/**
 * In-memory cache implementation
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Would need to track hits/misses for this
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Cache instances for different data types
 */
export const caches = {
  // API response cache (short TTL)
  api: new MemoryCache({ ttl: 2 * 60 * 1000, maxSize: 500 }), // 2 minutes

  // User data cache (medium TTL)
  user: new MemoryCache({ ttl: 10 * 60 * 1000, maxSize: 200 }), // 10 minutes

  // Workflow metadata cache (longer TTL)
  workflow: new MemoryCache({ ttl: 30 * 60 * 1000, maxSize: 1000 }), // 30 minutes

  // AI responses cache (very short TTL, expensive to regenerate)
  ai: new MemoryCache({ ttl: 60 * 1000, maxSize: 100 }), // 1 minute
};

/**
 * Cache key generators
 */
export const CacheKeys = {
  userWorkflows: (userId: string, page: number, limit: number, search: string) =>
    `user:${userId}:workflows:${page}:${limit}:${search}`,

  userExecutions: (userId: string, page: number, limit: number) =>
    `user:${userId}:executions:${page}:${limit}`,

  userSettings: (userId: string) =>
    `user:${userId}:settings`,

  workflowStats: (workflowId: string) =>
    `workflow:${workflowId}:stats`,

  userDashboard: (userId: string) =>
    `user:${userId}:dashboard`,

  aiResponse: (prompt: string, provider: string, temperature?: number) =>
    `ai:${provider}:${Buffer.from(prompt).toString('base64').substring(0, 50)}:${temperature || 0.7}`,
};

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  cache: MemoryCache = caches.api,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Cache invalidation utilities
 */
export const CacheInvalidation = {
  /**
   * Invalidate all user-related cache entries
   */
  invalidateUser(userId: string): void {
    const patterns = [
      `user:${userId}:`,
    ];

    patterns.forEach(pattern => {
      Object.values(caches).forEach(cache => {
        // Get all keys and delete matching ones
        const keysToDelete: string[] = [];
        (cache as any).cache.forEach((_: any, key: string) => {
          if (key.startsWith(pattern)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => cache.delete(key));
      });
    });
  },

  /**
   * Invalidate workflow-related cache entries
   */
  invalidateWorkflow(workflowId: string, userId: string): void {
    const patterns = [
      `workflow:${workflowId}:`,
      `user:${userId}:workflows:`,
      `user:${userId}:dashboard`,
    ];

    patterns.forEach(pattern => {
      Object.values(caches).forEach(cache => {
        const keysToDelete: string[] = [];
        (cache as any).cache.forEach((_: any, key: string) => {
          if (key.startsWith(pattern)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => cache.delete(key));
      });
    });
  },

  /**
   * Invalidate execution-related cache entries
   */
  invalidateExecution(userId: string, workflowId?: string): void {
    const patterns = [
      `user:${userId}:executions:`,
      `user:${userId}:dashboard`,
    ];

    if (workflowId) {
      patterns.push(`workflow:${workflowId}:stats`);
    }

    patterns.forEach(pattern => {
      Object.values(caches).forEach(cache => {
        const keysToDelete: string[] = [];
        (cache as any).cache.forEach((_: any, key: string) => {
          if (key.startsWith(pattern)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => cache.delete(key));
      });
    });
  },
};

/**
 * Cache warming utilities
 */
export const CacheWarming = {
  /**
   * Warm up user cache with common data
   */
  async warmUserCache(userId: string): Promise<void> {
    // This would typically fetch and cache common user data
    // Implementation depends on your specific data access patterns
    console.log(`Warming cache for user ${userId}`);
  },

  /**
   * Warm up workflow cache
   */
  async warmWorkflowCache(workflowId: string): Promise<void> {
    console.log(`Warming cache for workflow ${workflowId}`);
  },
};

/**
 * Cache cleanup job (run periodically)
 */
export function runCacheCleanup(): void {
  let totalCleaned = 0;
  
  Object.entries(caches).forEach(([name, cache]) => {
    const cleaned = cache.cleanup();
    totalCleaned += cleaned;
    console.log(`Cleaned ${cleaned} expired entries from ${name} cache`);
  });

  console.log(`Total cache cleanup: ${totalCleaned} entries removed`);
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(runCacheCleanup, 5 * 60 * 1000);
}

/**
 * Cache middleware for API routes
 */
export function withCache<T>(
  handler: (...args: any[]) => Promise<T>,
  keyGenerator: (...args: any[]) => string,
  options: { ttl?: number; cache?: MemoryCache } = {}
) {
  const cache = options.cache || caches.api;
  const ttl = options.ttl;

  return async (...args: any[]): Promise<T> => {
    const key = keyGenerator(...args);
    
    // Try cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute handler
    const result = await handler(...args);
    
    // Cache result
    cache.set(key, result, ttl);
    
    return result;
  };
}

/**
 * Response caching headers
 */
export const CacheHeaders = {
  /**
   * No cache headers for sensitive data
   */
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  /**
   * Short cache for API responses
   */
  shortCache: {
    'Cache-Control': 'public, max-age=60, s-maxage=60',
  },

  /**
   * Medium cache for less frequently changing data
   */
  mediumCache: {
    'Cache-Control': 'public, max-age=300, s-maxage=300',
  },

  /**
   * Long cache for static data
   */
  longCache: {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  },
};