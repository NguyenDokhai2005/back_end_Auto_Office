import { NextRequest } from 'next/server';
import { requireAuth, createServiceClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the authenticated user
 * 
 * Returns:
 * - Total workflows count
 * - Total executions count
 * - Success rate
 * - AI calls this month
 * - Active workflows count
 * - Recent activity trend
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    // Get current month start date
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Parallel queries for better performance
    const [
      workflowsResult,
      executionsResult,
      monthExecutionsResult,
      successfulExecutionsResult,
      activeWorkflowsResult,
    ] = await Promise.all([
      // Total workflows
      supabase
        .from('workflows')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Total executions
      supabase
        .from('executions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Executions this month
      supabase
        .from('executions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('started_at', monthStart),

      // Successful executions
      supabase
        .from('executions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed'),

      // Active workflows (updated in last 30 days)
      supabase
        .from('workflows')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Check for errors
    if (workflowsResult.error) throw workflowsResult.error;
    if (executionsResult.error) throw executionsResult.error;
    if (monthExecutionsResult.error) throw monthExecutionsResult.error;
    if (successfulExecutionsResult.error) throw successfulExecutionsResult.error;
    if (activeWorkflowsResult.error) throw activeWorkflowsResult.error;

    // Calculate metrics
    const totalWorkflows = workflowsResult.count || 0;
    const totalExecutions = executionsResult.count || 0;
    const executionsThisMonth = monthExecutionsResult.count || 0;
    const successfulExecutions = successfulExecutionsResult.count || 0;
    const activeWorkflows = activeWorkflowsResult.count || 0;

    // Calculate success rate
    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100) 
      : 0;

    // Get last 7 days activity for trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentActivity, error: activityError } = await supabase
      .from('executions')
      .select('started_at, status')
      .eq('user_id', user.id)
      .gte('started_at', sevenDaysAgo)
      .order('started_at', { ascending: true });

    if (activityError) throw activityError;

    // Group by day for trend
    const dailyActivity = (recentActivity || []).reduce((acc: any, exec: any) => {
      const date = new Date(exec.started_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, successful: 0 };
      }
      acc[date].total++;
      if (exec.status === 'completed') {
        acc[date].successful++;
      }
      return acc;
    }, {});

    // Calculate trend (compare last 3 days vs previous 3 days)
    const dates = Object.keys(dailyActivity).sort();
    const recentDays = dates.slice(-3);
    const previousDays = dates.slice(-6, -3);
    
    const recentTotal = recentDays.reduce((sum, date) => sum + dailyActivity[date].total, 0);
    const previousTotal = previousDays.reduce((sum, date) => sum + dailyActivity[date].total, 0);
    
    const trend = previousTotal > 0 
      ? Math.round(((recentTotal - previousTotal) / previousTotal) * 100)
      : 0;

    return ApiResponse.success({
      totalWorkflows,
      totalExecutions,
      executionsThisMonth,
      successRate,
      activeWorkflows,
      trend: {
        value: trend,
        isPositive: trend >= 0,
      },
      dailyActivity: Object.entries(dailyActivity).map(([date, data]: [string, any]) => ({
        date,
        total: data.total,
        successful: data.successful,
        successRate: data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
