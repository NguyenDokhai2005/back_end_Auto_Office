import { NextRequest } from 'next/server';
import { GET as getExecutions, POST as createExecution } from '@/app/api/executions/route';
import { GET as getExecution, PATCH as updateExecution } from '@/app/api/executions/[id]/route';

// Mock Supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockSingle = jest.fn();

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  })),
};

// Chain methods
mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
  range: mockRange,
  single: mockSingle,
});

mockInsert.mockReturnValue({
  select: () => ({
    single: mockSingle,
  }),
});

mockUpdate.mockReturnValue({
  eq: () => ({
    select: () => ({
      single: mockSingle,
    }),
  }),
});

mockEq.mockReturnValue({
  order: mockOrder,
  single: mockSingle,
});

mockOrder.mockReturnValue({
  range: mockRange,
});

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
  })),
}));

describe('Execution Tracking Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/executions - Create Execution', () => {
    it('should create execution record successfully', async () => {
      const mockExecution = {
        id: 'exec-123',
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'running',
        results: null,
        error: null,
        started_at: '2024-01-01T10:00:00Z',
        completed_at: null,
      };

      mockSingle.mockResolvedValue({
        data: mockExecution,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: 'wf-123',
          status: 'running',
        }),
      });

      const response = await createExecution(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data.id).toBe('exec-123');
      expect(responseData.data.status).toBe('running');
      expect(responseData.data.workflow_id).toBe('wf-123');
      expect(mockInsert).toHaveBeenCalledWith({
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'running',
        results: null,
        error: null,
      });
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/executions', {
        method: 'POST',
        body: JSON.stringify({
          status: 'running',
          // Missing workflow_id
        }),
      });

      const response = await createExecution(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should validate execution status', async () => {
      const request = new NextRequest('http://localhost:3000/api/executions', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: 'wf-123',
          status: 'invalid-status',
        }),
      });

      const response = await createExecution(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid status. Must be one of: running, completed, failed');
    });

    it('should handle database insertion errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      });

      const request = new NextRequest('http://localhost:3000/api/executions', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: 'non-existent-workflow',
          status: 'running',
        }),
      });

      const response = await createExecution(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Foreign key constraint violation');
    });
  });

  describe('GET /api/executions - List Executions', () => {
    it('should return user executions with pagination', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          workflow_id: 'wf-1',
          user_id: 'user-123',
          status: 'completed',
          results: { output: 'success' },
          error: null,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
        },
        {
          id: 'exec-2',
          workflow_id: 'wf-2',
          user_id: 'user-123',
          status: 'failed',
          results: null,
          error: 'Node execution failed',
          started_at: '2024-01-01T11:00:00Z',
          completed_at: '2024-01-01T11:02:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockExecutions,
        error: null,
        count: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/executions?page=1&limit=10');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.executions).toHaveLength(2);
      expect(responseData.data.total).toBe(2);
      expect(responseData.data.page).toBe(1);
      expect(responseData.data.limit).toBe(10);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('executions');
    });

    it('should filter by workflow_id', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          workflow_id: 'wf-specific',
          user_id: 'user-123',
          status: 'completed',
          results: { output: 'success' },
          error: null,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockExecutions,
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/executions?workflow_id=wf-specific');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.executions).toHaveLength(1);
      expect(responseData.data.executions[0].workflow_id).toBe('wf-specific');
      expect(mockEq).toHaveBeenCalledWith('workflow_id', 'wf-specific');
    });

    it('should filter by status', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          workflow_id: 'wf-1',
          user_id: 'user-123',
          status: 'failed',
          results: null,
          error: 'Execution failed',
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:02:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockExecutions,
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/executions?status=failed');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.executions).toHaveLength(1);
      expect(responseData.data.executions[0].status).toBe('failed');
      expect(mockEq).toHaveBeenCalledWith('status', 'failed');
    });

    it('should handle date range filtering', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          workflow_id: 'wf-1',
          user_id: 'user-123',
          status: 'completed',
          results: { output: 'success' },
          error: null,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockExecutions,
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/executions?start_date=2024-01-01&end_date=2024-01-02');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.executions).toHaveLength(1);
    });

    it('should return execution summary statistics', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          workflow_id: 'wf-1',
          user_id: 'user-123',
          status: 'completed',
          results: { output: 'success' },
          error: null,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
        },
        {
          id: 'exec-2',
          workflow_id: 'wf-1',
          user_id: 'user-123',
          status: 'failed',
          results: null,
          error: 'Node failed',
          started_at: '2024-01-01T11:00:00Z',
          completed_at: '2024-01-01T11:02:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockExecutions,
        error: null,
        count: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/executions');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.summary).toBeDefined();
      expect(responseData.data.summary.total).toBe(2);
      expect(responseData.data.summary.completed).toBe(1);
      expect(responseData.data.summary.failed).toBe(1);
      expect(responseData.data.summary.running).toBe(0);
    });
  });

  describe('GET /api/executions/[id] - Get Single Execution', () => {
    it('should return specific execution with details', async () => {
      const mockExecution = {
        id: 'exec-123',
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'completed',
        results: {
          nodes: {
            'node-1': { output: 'Hello' },
            'node-2': { output: 'World' },
          },
          final_output: 'Hello World',
        },
        error: null,
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:05:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockExecution,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions/exec-123');
      const response = await getExecution(request, { params: { id: 'exec-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.id).toBe('exec-123');
      expect(responseData.data.status).toBe('completed');
      expect(responseData.data.results.final_output).toBe('Hello World');
      expect(mockEq).toHaveBeenCalledWith('id', 'exec-123');
    });

    it('should return 404 for non-existent execution', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions/non-existent');
      const response = await getExecution(request, { params: { id: 'non-existent' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Execution not found');
    });

    it('should calculate execution metrics', async () => {
      const mockExecution = {
        id: 'exec-123',
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'completed',
        results: {
          nodes: {
            'node-1': { output: 'Hello', duration: 1000 },
            'node-2': { output: 'World', duration: 2000 },
          },
        },
        error: null,
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:05:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockExecution,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions/exec-123');
      const response = await getExecution(request, { params: { id: 'exec-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.metrics).toBeDefined();
      expect(responseData.data.metrics.duration).toBe(300000); // 5 minutes in ms
      expect(responseData.data.metrics.nodes_executed).toBe(2);
    });
  });

  describe('PATCH /api/executions/[id] - Update Execution', () => {
    it('should update execution status successfully', async () => {
      const mockUpdatedExecution = {
        id: 'exec-123',
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'completed',
        results: { output: 'Final result' },
        error: null,
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:05:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockUpdatedExecution,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions/exec-123', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          results: { output: 'Final result' },
        }),
      });

      const response = await updateExecution(request, { params: { id: 'exec-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('completed');
      expect(responseData.data.results.output).toBe('Final result');
    });

    it('should update execution with error', async () => {
      const mockUpdatedExecution = {
        id: 'exec-123',
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'failed',
        results: null,
        error: 'Node execution failed: Invalid input',
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:02:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockUpdatedExecution,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions/exec-123', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'failed',
          error: 'Node execution failed: Invalid input',
        }),
      });

      const response = await updateExecution(request, { params: { id: 'exec-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.status).toBe('failed');
      expect(responseData.data.error).toBe('Node execution failed: Invalid input');
    });

    it('should validate status transitions', async () => {
      const request = new NextRequest('http://localhost:3000/api/executions/exec-123', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'invalid-status',
        }),
      });

      const response = await updateExecution(request, { params: { id: 'exec-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid status. Must be one of: running, completed, failed');
    });

    it('should handle concurrent updates', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Row was updated by another process' },
      });

      const request = new NextRequest('http://localhost:3000/api/executions/exec-123', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
        }),
      });

      const response = await updateExecution(request, { params: { id: 'exec-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Row was updated by another process');
    });
  });

  describe('Execution Lifecycle Integration', () => {
    it('should complete full execution lifecycle', async () => {
      // Create execution
      const newExecution = {
        id: 'exec-lifecycle',
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'running',
        results: null,
        error: null,
        started_at: '2024-01-01T10:00:00Z',
        completed_at: null,
      };

      mockSingle.mockResolvedValueOnce({
        data: newExecution,
        error: null,
      });

      const createRequest = new NextRequest('http://localhost:3000/api/executions', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: 'wf-123',
          status: 'running',
        }),
      });

      const createResponse = await createExecution(createRequest);
      expect(createResponse.status).toBe(201);

      // Read execution
      mockSingle.mockResolvedValueOnce({
        data: newExecution,
        error: null,
      });

      const readRequest = new NextRequest('http://localhost:3000/api/executions/exec-lifecycle');
      const readResponse = await getExecution(readRequest, { params: { id: 'exec-lifecycle' } });
      expect(readResponse.status).toBe(200);

      // Update execution to completed
      const completedExecution = {
        ...newExecution,
        status: 'completed',
        results: { output: 'Success' },
        completed_at: '2024-01-01T10:05:00Z',
      };

      mockSingle.mockResolvedValueOnce({
        data: completedExecution,
        error: null,
      });

      const updateRequest = new NextRequest('http://localhost:3000/api/executions/exec-lifecycle', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          results: { output: 'Success' },
        }),
      });

      const updateResponse = await updateExecution(updateRequest, { params: { id: 'exec-lifecycle' } });
      expect(updateResponse.status).toBe(200);

      // Verify final state
      const finalData = await updateResponse.json();
      expect(finalData.data.status).toBe('completed');
      expect(finalData.data.results.output).toBe('Success');
    });
  });

  describe('Performance and Analytics', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResults = {
        nodes: {},
        data_processed: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` })),
        metrics: {
          total_items: 1000,
          processing_time: 30000,
          memory_used: '256MB',
        },
      };

      // Populate nodes with large data
      for (let i = 0; i < 100; i++) {
        largeResults.nodes[`node-${i}`] = {
          output: `Output from node ${i}`,
          duration: Math.random() * 1000,
          items_processed: 10,
        };
      }

      const mockExecution = {
        id: 'exec-large',
        workflow_id: 'wf-123',
        user_id: 'user-123',
        status: 'completed',
        results: largeResults,
        error: null,
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:30:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockExecution,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions/exec-large');
      const response = await getExecution(request, { params: { id: 'exec-large' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.results.data_processed).toHaveLength(1000);
      expect(responseData.data.metrics.nodes_executed).toBe(100);
    });

    it('should calculate execution analytics correctly', async () => {
      const mockExecutions = [
        {
          id: 'exec-1',
          workflow_id: 'wf-123',
          status: 'completed',
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
        },
        {
          id: 'exec-2',
          workflow_id: 'wf-123',
          status: 'completed',
          started_at: '2024-01-01T11:00:00Z',
          completed_at: '2024-01-01T11:03:00Z',
        },
        {
          id: 'exec-3',
          workflow_id: 'wf-123',
          status: 'failed',
          started_at: '2024-01-01T12:00:00Z',
          completed_at: '2024-01-01T12:01:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockExecutions,
        error: null,
        count: 3,
      });

      const request = new NextRequest('http://localhost:3000/api/executions?workflow_id=wf-123');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.summary.total).toBe(3);
      expect(responseData.data.summary.completed).toBe(2);
      expect(responseData.data.summary.failed).toBe(1);
      expect(responseData.data.summary.success_rate).toBe(66.67);
      expect(responseData.data.summary.avg_duration).toBe(240000); // Average of 5min, 3min, 1min
    });
  });
});