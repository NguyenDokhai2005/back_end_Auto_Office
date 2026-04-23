-- ============================================
-- SIMPLE PERFORMANCE INDEXES
-- Run this in Supabase SQL Editor
-- ============================================

-- Workflows table - Performance indexes
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
