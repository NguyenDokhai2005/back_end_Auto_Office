import { NextRequest } from 'next/server';
import { requireAuth, createServiceClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/top-workflows
 * Get top performing workflows based on execution count and success rate
 * 
 * Query params:
 * - limit: number of workflows to return (default: 10)
 * - sortBy: 'executions' | 'success_rate' | 'recent' (default: 'executions')
 * 
 * Returns:
 * - Top workflows with execution stats
 * - Success rate
 * - Last execution time
 * - AI models used
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'executions';

    // Get all workflows for the user
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('id, name, description, metadata, created_at, updated_at')
      .eq('user_id', user.id);

    if (workflowsError) throw workflowsError;

    if (!workflows || workflows.length === 0) {
      return ApiResponse.success({
        topWorkflows: [],
        total: 0,
      });
    }

    // Get execution stats for each workflow
    const workflowIds = workflows.map((w: any) => w.id);
    
    const { data: executions, error: executionsError } = await supabase
      .from('executions')
      .select('workflow_id, status, started_at, completed_at')
      .eq('user_id', user.id)
      .in('workflow_id', workflowIds);

    if (executionsError) throw executionsError;

    // Calculate stats for each workflow
    const workflowStats = workflows.map((workflow: any) => {
      const workflowExecutions = (executions || []).filter(
        (e: any) => e.workflow_id === workflow.id
      );

      const totalExecutions = workflowExecutions.length;
      const successfulExecutions = workflowExecutions.filter(
        (e: any) => e.status === 'completed'
      ).length;
      const failedExecutions = workflowExecutions.filter(
        (e: any) => e.status === 'failed'
      ).length;
      const runningExecutions = workflowExecutions.filter(
        (e: any) => e.status === 'running'
      ).length;

      const successRate = totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100)
        : 0;

      // Get last execution
      const sortedExecutions = workflowExecutions.sort(
        (a: any, b: any) => 
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      const lastExecution = sortedExecutions[0];

      // Calculate average duration
      const completedExecutions = workflowExecutions.filter(
        (e: any) => e.started_at && e.completed_at
      );
      const avgDuration = completedExecutions.length > 0
        ? completedExecutions.reduce((sum: number, e: any) => {
            const start = new Date(e.started_at).getTime();
            const end = new Date(e.completed_at).getTime();
            return sum + (end - start) / 1000;
          }, 0) / completedExecutions.length
        : 0;

      // Extract AI models from metadata
      const aiModels = workflow.metadata?.aiModels || [];
      const platforms = [...new Set(aiModels)]; // Unique models

      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        successRate,
        avgDuration: Math.round(avgDuration),
        lastExecutedAt: lastExecution?.started_at || null,
        lastExecutionStatus: lastExecution?.status || null,
        platforms,
        tags: workflow.metadata?.tags || [],
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
        isActive: runningExecutions > 0,
        status: runningExecutions > 0 ? 'running' : 
                totalExecutions > 0 ? 'active' : 'draft',
      };
    });

    // Sort based on sortBy parameter
    let sortedWorkflows = [...workflowStats];
    
    switch (sortBy) {
      case 'success_rate':
        sortedWorkflows.sort((a, b) => {
          // First by success rate, then by execution count
          if (b.successRate !== a.successRate) {
            return b.successRate - a.successRate;
          }
          return b.totalExecutions - a.totalExecutions;
        });
        break;
      case 'recent':
        sortedWorkflows.sort((a, b) => {
          const aTime = a.lastExecutedAt ? new Date(a.lastExecutedAt).getTime() : 0;
          const bTime = b.lastExecutedAt ? new Date(b.lastExecutedAt).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case 'executions':
      default:
        sortedWorkflows.sort((a, b) => b.totalExecutions - a.totalExecutions);
        break;
    }

    // Limit results
    const topWorkflows = sortedWorkflows.slice(0, limit);

    // Calculate aggregate stats
    const totalExecutions = workflowStats.reduce((sum, w) => sum + w.totalExecutions, 0);
    const totalSuccessful = workflowStats.reduce((sum, w) => sum + w.successfulExecutions, 0);
    const overallSuccessRate = totalExecutions > 0
      ? Math.round((totalSuccessful / totalExecutions) * 100)
      : 0;

    return ApiResponse.success({
      topWorkflows,
      total: workflows.length,
      aggregateStats: {
        totalExecutions,
        totalSuccessful,
        overallSuccessRate,
        activeWorkflows: workflowStats.filter(w => w.status === 'active' || w.status === 'running').length,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
