import { NextRequest } from 'next/server';
import { requireAuth, createServiceClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/recent
 * Get recent activity for dashboard
 * 
 * Query params:
 * - limit: number of items to return (default: 10)
 * 
 * Returns:
 * - Recent workflows (last updated)
 * - Recent executions (last run)
 * - Quick stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Parallel queries
    const [recentWorkflowsResult, recentExecutionsResult] = await Promise.all([
      // Recent workflows (last updated)
      supabase
        .from('workflows')
        .select('id, name, description, metadata, updated_at, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit),

      // Recent executions with workflow info
      supabase
        .from('executions')
        .select(`
          id,
          workflow_id,
          status,
          started_at,
          completed_at,
          error,
          workflows (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit),
    ]);

    if (recentWorkflowsResult.error) throw recentWorkflowsResult.error;
    if (recentExecutionsResult.error) throw recentExecutionsResult.error;

    // Process workflows data
    const recentWorkflows = (recentWorkflowsResult.data || []).map((workflow: any) => {
      // Count nodes if available in metadata
      const nodeCount = workflow.metadata?.nodeCount || 0;
      
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodeCount,
        tags: workflow.metadata?.tags || [],
        updatedAt: workflow.updated_at,
        createdAt: workflow.created_at,
        isNew: new Date(workflow.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000, // Created in last 24h
      };
    });

    // Process executions data
    const recentExecutions = (recentExecutionsResult.data || []).map((exec: any) => {
      let duration = null;
      if (exec.started_at && exec.completed_at) {
        const start = new Date(exec.started_at).getTime();
        const end = new Date(exec.completed_at).getTime();
        duration = Math.round((end - start) / 1000); // seconds
      }

      return {
        id: exec.id,
        workflowId: exec.workflow_id,
        workflowName: exec.workflows?.name || 'Unknown Workflow',
        status: exec.status,
        startedAt: exec.started_at,
        completedAt: exec.completed_at,
        duration,
        error: exec.error,
        isRunning: exec.status === 'running',
        isFailed: exec.status === 'failed',
        isCompleted: exec.status === 'completed',
      };
    });

    // Calculate quick stats from recent data
    const runningExecutions = recentExecutions.filter((e: any) => e.isRunning).length;
    const failedExecutions = recentExecutions.filter((e: any) => e.isFailed).length;
    const avgDuration = recentExecutions
      .filter((e: any) => e.duration !== null)
      .reduce((sum: number, e: any) => sum + (e.duration || 0), 0) / 
      (recentExecutions.filter((e: any) => e.duration !== null).length || 1);

    return ApiResponse.success({
      recentWorkflows,
      recentExecutions,
      quickStats: {
        runningExecutions,
        failedExecutions,
        avgDuration: Math.round(avgDuration),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
