/**
 * Database connection pooling configuration
 * This module provides optimized database connection management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface PoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
}

/**
 * Connection pool for Supabase clients
 */
class SupabaseConnectionPool {
  private pool: SupabaseClient[] = [];
  private activeConnections = new Set<SupabaseClient>();
  private waitingQueue: Array<{
    resolve: (client: SupabaseClient) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  
  private config: PoolConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      maxConnections: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
      idleTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '30000'),
      connectionTimeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<SupabaseClient> {
    // Try to get an idle connection first
    const idleConnection = this.getIdleConnection();
    if (idleConnection) {
      this.activeConnections.add(idleConnection);
      return idleConnection;
    }

    // Create new connection if under limit
    if (this.getTotalConnections() < this.config.maxConnections) {
      const newConnection = this.createConnection();
      this.activeConnections.add(newConnection);
      return newConnection;
    }

    // Wait for a connection to become available
    return this.waitForConnection();
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(client: SupabaseClient): void {
    this.activeConnections.delete(client);
    
    // If there are waiting requests, give the connection to the next in queue
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      if (waiter) {
        this.activeConnections.add(client);
        waiter.resolve(client);
        return;
      }
    }

    // Add back to idle pool
    this.pool.push(client);
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      totalConnections: this.getTotalConnections(),
      activeConnections: this.activeConnections.size,
      idleConnections: this.pool.length,
      waitingRequests: this.waitingQueue.length
    };
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Reject all waiting requests
    this.waitingQueue.forEach(waiter => {
      waiter.reject(new Error('Connection pool is closing'));
    });
    this.waitingQueue = [];

    // Clear all connections
    this.pool = [];
    this.activeConnections.clear();
  }

  private getIdleConnection(): SupabaseClient | null {
    return this.pool.pop() || null;
  }

  private getTotalConnections(): number {
    return this.pool.length + this.activeConnections.size;
  }

  private createConnection(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pool': 'true',
        },
      },
    });
  }

  private async waitForConnection(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const index = this.waitingQueue.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      this.waitingQueue.push({
        resolve: (client) => {
          clearTimeout(timeout);
          resolve(client);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      });
    });
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredWaiters();
    }, 30000); // Run every 30 seconds
  }

  private cleanupExpiredWaiters(): void {
    const now = Date.now();
    const expiredWaiters = this.waitingQueue.filter(
      waiter => now - waiter.timestamp > this.config.connectionTimeout
    );

    expiredWaiters.forEach(waiter => {
      waiter.reject(new Error('Connection request expired'));
    });

    this.waitingQueue = this.waitingQueue.filter(
      waiter => now - waiter.timestamp <= this.config.connectionTimeout
    );
  }
}

// Global connection pool instance
let globalPool: SupabaseConnectionPool | null = null;

/**
 * Get the global connection pool instance
 */
export function getConnectionPool(): SupabaseConnectionPool {
  if (!globalPool) {
    globalPool = new SupabaseConnectionPool();
  }
  return globalPool;
}

/**
 * Execute a database operation with automatic connection management
 */
export async function withConnection<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const pool = getConnectionPool();
  const client = await pool.getConnection();
  
  try {
    const result = await operation(client);
    return result;
  } finally {
    pool.releaseConnection(client);
  }
}

/**
 * Execute multiple operations in a transaction-like manner
 */
export async function withTransaction<T>(
  operations: Array<(client: SupabaseClient) => Promise<any>>
): Promise<T[]> {
  const pool = getConnectionPool();
  const client = await pool.getConnection();
  
  try {
    const results = [];
    for (const operation of operations) {
      const result = await operation(client);
      results.push(result);
    }
    return results;
  } finally {
    pool.releaseConnection(client);
  }
}

/**
 * Health check for the connection pool
 */
export async function checkPoolHealth(): Promise<{
  healthy: boolean;
  stats: PoolStats;
  errors: string[];
}> {
  const pool = getConnectionPool();
  const stats = pool.getStats();
  const errors: string[] = [];

  // Check if pool is overloaded
  if (stats.waitingRequests > 10) {
    errors.push('High number of waiting requests');
  }

  // Check if all connections are active (might indicate a leak)
  if (stats.activeConnections === stats.totalConnections && stats.totalConnections > 0) {
    errors.push('All connections are active - possible connection leak');
  }

  // Try to get a connection to test connectivity
  try {
    const testClient = await pool.getConnection();
    pool.releaseConnection(testClient);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Connection test failed: ${errorMessage}`);
  }

  return {
    healthy: errors.length === 0,
    stats,
    errors
  };
}

/**
 * Graceful shutdown of the connection pool
 */
export async function shutdownPool(): Promise<void> {
  if (globalPool) {
    await globalPool.close();
    globalPool = null;
  }
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownPool);
  process.on('SIGINT', shutdownPool);
  process.on('beforeExit', shutdownPool);
}