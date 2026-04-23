-- Performance Optimization - Database Indexes
-- Run this SQL in your Supabase SQL Editor after the main schema

-- ============================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================

-- Workflows table - Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_name_search 
ON workflows USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_workflows_metadata_tags 
ON workflows USING gin((metadata->'tags'));

CREATE INDEX IF NOT EXISTS idx_workflows_metadata_author 
ON workflows((metadata->>'author'));

-- Executions table - Performance indexes
CREATE INDEX IF NOT EXISTS idx_executions_workflow_user 
ON executions(workflow_id, user_id);

CREATE INDEX IF NOT EXISTS idx_executions_status_started 
ON executions(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_executions_completed_at 
ON executions(completed_at DESC) WHERE completed_at IS NOT NULL;

-- User settings - Composite index
CREATE INDEX IF NOT EXISTS idx_user_settings_updated 
ON user_settings(user_id, updated_at);

-- ============================================
-- QUERY OPTIMIZATION VIEWS
-- ============================================

-- View for workflow statistics
CREATE OR REPLACE VIEW workflow_stats AS
SELECT 
  w.id,
  w.name,
  w.user_id,
  w.created_at,
  w.updated_at,
  COUNT(e.id) as execution_count,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as successful_executions,
  COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed_executions,
  MAX(e.started_at) as last_execution,
  AVG(EXTRACT(EPOCH FROM (e.completed_at - e.started_at))) as avg_execution_time
FROM workflows w
LEFT JOIN executions e ON w.id = e.workflow_id
GROUP BY w.id, w.name, w.user_id, w.created_at, w.updated_at;

-- View for user activity
CREATE OR REPLACE VIEW user_activity AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT w.id) as workflow_count,
  COUNT(e.id) as total_executions,
  COUNT(CASE WHEN e.started_at > NOW() - INTERVAL '7 days' THEN 1 END) as executions_last_7_days,
  COUNT(CASE WHEN e.started_at > NOW() - INTERVAL '30 days' THEN 1 END) as executions_last_30_days,
  MAX(e.started_at) as last_activity
FROM auth.users u
LEFT JOIN workflows w ON u.id = w.user_id
LEFT JOIN executions e ON w.id = e.workflow_id
GROUP BY u.id;

-- ============================================
-- PERFORMANCE FUNCTIONS
-- ============================================

-- Function to get workflow with execution stats
CREATE OR REPLACE FUNCTION get_workflow_with_stats(workflow_id UUID, requesting_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  nodes JSONB,
  edges JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  execution_count BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  last_execution TIMESTAMPTZ,
  avg_execution_time NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.description,
    w.nodes,
    w.edges,
    w.metadata,
    w.created_at,
    w.updated_at,
    COALESCE(ws.execution_count, 0) as execution_count,
    COALESCE(ws.successful_executions, 0) as successful_executions,
    COALESCE(ws.failed_executions, 0) as failed_executions,
    ws.last_execution,
    ws.avg_execution_time
  FROM workflows w
  LEFT JOIN workflow_stats ws ON w.id = ws.id
  WHERE w.id = workflow_id 
    AND w.user_id = requesting_user_id;
END;
$$;

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard(requesting_user_id UUID)
RETURNS TABLE (
  workflow_count BIGINT,
  total_executions BIGINT,
  executions_last_7_days BIGINT,
  executions_last_30_days BIGINT,
  last_activity TIMESTAMPTZ,
  recent_workflows JSONB,
  recent_executions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.workflow_count,
    ua.total_executions,
    ua.executions_last_7_days,
    ua.executions_last_30_days,
    ua.last_activity,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', w.id,
          'name', w.name,
          'updated_at', w.updated_at
        )
      )
      FROM workflows w
      WHERE w.user_id = requesting_user_id
      ORDER BY w.updated_at DESC
      LIMIT 5
    ) as recent_workflows,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'workflow_id', e.workflow_id,
          'status', e.status,
          'started_at', e.started_at,
          'workflow_name', w.name
        )
      )
      FROM executions e
      JOIN workflows w ON e.workflow_id = w.id
      WHERE e.user_id = requesting_user_id
      ORDER BY e.started_at DESC
      LIMIT 10
    ) as recent_executions
  FROM user_activity ua
  WHERE ua.user_id = requesting_user_id;
END;
$$;

-- ============================================
-- CONNECTION POOLING CONFIGURATION
-- ============================================

-- Set connection pool parameters (adjust based on your needs)
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Note: These settings require a database restart to take effect
-- In Supabase, these are managed automatically, but you can request adjustments

-- ============================================
-- QUERY PERFORMANCE MONITORING
-- ============================================

-- Enable query statistics (if not already enabled)
-- This helps identify slow queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Function to get slow queries (for monitoring)
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    pss.query,
    pss.calls,
    pss.total_exec_time as total_time,
    pss.mean_exec_time as mean_time,
    pss.rows
  FROM pg_stat_statements pss
  WHERE pss.mean_exec_time > 100 -- queries taking more than 100ms on average
  ORDER BY pss.mean_exec_time DESC
  LIMIT 20;
$$;

-- ============================================
-- CLEANUP AND MAINTENANCE
-- ============================================

-- Function to clean up old executions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_executions(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM executions 
  WHERE started_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('workflows', 'executions', 'user_settings')
ORDER BY tablename, indexname;

-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- ============================================
-- NOTES
-- ============================================

/*
Performance Optimization Summary:

1. INDEXES ADDED:
   - Full-text search on workflow names/descriptions
   - GIN index on metadata tags for fast filtering
   - Composite indexes for common query patterns
   - Partial indexes for specific conditions

2. VIEWS CREATED:
   - workflow_stats: Pre-computed statistics
   - user_activity: User engagement metrics

3. FUNCTIONS CREATED:
   - get_workflow_with_stats: Efficient workflow retrieval with stats
   - get_user_dashboard: Single query for dashboard data
   - cleanup_old_executions: Maintenance function

4. MONITORING:
   - pg_stat_statements for query performance
   - get_slow_queries function for identifying bottlenecks

5. BEST PRACTICES:
   - Use CONCURRENTLY for index creation to avoid locks
   - Partial indexes for filtered queries
   - Composite indexes for multi-column queries
   - Regular cleanup of old data

Remember to:
- Monitor query performance regularly
- Run ANALYZE after bulk data changes
- Consider partitioning for very large tables
- Use connection pooling (PgBouncer) for high traffic
*/