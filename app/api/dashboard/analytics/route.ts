import { NextRequest } from 'next/server';
import { requireAuth, createServiceClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/analytics
 * Get analytics data for charts and graphs
 * 
 * Query params:
 * - period: 'week' | 'month' | 'year' (default: 'week')
 * - metric: 'executions' | 'success_rate' | 'duration' (default: 'executions')
 * 
 * Returns:
 * - Time series data for charts
 * - Aggregated metrics
 * - Comparison with previous period
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServiceClient();

    // Get query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const metric = searchParams.get('metric') || 'executions';

    // Calculate date range based on period
    let startDate: Date;
    let previousStartDate: Date;
    const now = new Date();

    switch (period) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'week':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
    }

    // Fetch executions for current period
    const { data: currentPeriodData, error: currentError } = await supabase
      .from('executions')
      .select('id, status, started_at, completed_at')
      .eq('user_id', user.id)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: true });

    if (currentError) throw currentError;

    // Fetch executions for previous period (for comparison)
    const { data: previousPeriodData, error: previousError } = await supabase
      .from('executions')
      .select('id, status, started_at, completed_at')
      .eq('user_id', user.id)
      .gte('started_at', previousStartDate.toISOString())
      .lt('started_at', startDate.toISOString())
      .order('started_at', { ascending: true });

    if (previousError) throw previousError;

    // Process data based on metric type
    let timeSeriesData: any[] = [];
    let currentTotal = 0;
    let previousTotal = 0;

    if (metric === 'executions') {
      // Group by day/week/month based on period
      const groupedData = groupByTimePeriod(currentPeriodData || [], period);
      timeSeriesData = Object.entries(groupedData).map(([date, count]) => ({
        date,
        value: count,
      }));
      currentTotal = (currentPeriodData || []).length;
      previousTotal = (previousPeriodData || []).length;
    } else if (metric === 'success_rate') {
      const groupedData = groupByTimePeriod(currentPeriodData || [], period);
      timeSeriesData = Object.entries(groupedData).map(([date, executions]: [string, any]) => {
        const successful = executions.filter((e: any) => e.status === 'completed').length;
        const total = executions.length;
        return {
          date,
          value: total > 0 ? Math.round((successful / total) * 100) : 0,
          total,
          successful,
        };
      });
      
      const currentSuccessful = (currentPeriodData || []).filter((e: any) => e.status === 'completed').length;
      const previousSuccessful = (previousPeriodData || []).filter((e: any) => e.status === 'completed').length;
      
      currentTotal = currentPeriodData?.length || 0;
      previousTotal = previousPeriodData?.length || 0;
      
      currentTotal = currentTotal > 0 ? Math.round((currentSuccessful / currentTotal) * 100) : 0;
      previousTotal = previousTotal > 0 ? Math.round((previousSuccessful / previousTotal) * 100) : 0;
    } else if (metric === 'duration') {
      const groupedData = groupByTimePeriod(currentPeriodData || [], period);
      timeSeriesData = Object.entries(groupedData).map(([date, executions]: [string, any]) => {
        const durations = executions
          .filter((e: any) => e.started_at && e.completed_at)
          .map((e: any) => {
            const start = new Date(e.started_at).getTime();
            const end = new Date(e.completed_at).getTime();
            return (end - start) / 1000; // seconds
          });
        
        const avgDuration = durations.length > 0
          ? durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length
          : 0;
        
        return {
          date,
          value: Math.round(avgDuration),
          count: durations.length,
        };
      });
      
      currentTotal = calculateAvgDuration(currentPeriodData || []);
      previousTotal = calculateAvgDuration(previousPeriodData || []);
    }

    // Calculate change percentage
    const change = previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0;

    return ApiResponse.success({
      period,
      metric,
      timeSeriesData,
      summary: {
        current: currentTotal,
        previous: previousTotal,
        change,
        isPositive: change >= 0,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// Helper function to group data by time period
function groupByTimePeriod(data: any[], period: string): Record<string, any> {
  const grouped: Record<string, any> = {};

  data.forEach((item) => {
    const date = new Date(item.started_at);
    let key: string;

    if (period === 'year') {
      // Group by month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'month') {
      // Group by day
      key = date.toISOString().split('T')[0];
    } else {
      // Group by day (week)
      key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  // Convert arrays to counts for executions metric
  Object.keys(grouped).forEach((key) => {
    if (Array.isArray(grouped[key])) {
      const items = grouped[key];
      grouped[key] = items.length;
    }
  });

  return grouped;
}

// Helper function to calculate average duration
function calculateAvgDuration(data: any[]): number {
  const durations = data
    .filter((e: any) => e.started_at && e.completed_at)
    .map((e: any) => {
      const start = new Date(e.started_at).getTime();
      const end = new Date(e.completed_at).getTime();
      return (end - start) / 1000; // seconds
    });

  if (durations.length === 0) return 0;

  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  return Math.round(avg);
}
