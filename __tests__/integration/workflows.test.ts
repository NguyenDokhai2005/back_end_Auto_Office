import { NextRequest } from 'next/server';
import { GET as getWorkflows, POST as createWorkflow } from '@/app/api/workflows/route';
import { GET as getWorkflow, PUT as updateWorkflow, DELETE as deleteWorkflow } from '@/app/api/workflows/[id]/route';

// Mock Supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockOr = jest.fn();
const mockSingle = jest.fn();

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })),
};

// Chain methods
mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
  range: mockRange,
  or: mockOr,
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

mockDelete.mockReturnValue({
  eq: mockEq,
});

mockEq.mockReturnValue({
  order: mockOrder,
  single: mockSingle,
});

mockOrder.mockReturnValue({
  range: mockRange,
});

mockRange.mockReturnValue({
  or: mockOr,
});

mockOr.mockReturnValue({});

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
  })),
}));

describe('Workflows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/workflows - List Workflows', () => {
    it('should return user workflows with pagination', async () => {
      const mockWorkflows = [
        {
          id: 'wf-1',
          name: 'Test Workflow 1',
          description: 'First test workflow',
          metadata: { author: 'test@example.com', version: 1 },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'wf-2',
          name: 'Test Workflow 2',
          description: 'Second test workflow',
          metadata: { author: 'test@example.com', version: 1 },
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockRange.mockResolvedValue({
        data: mockWorkflows,
        error: null,
        count: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows?page=1&limit=10');
      const response = await getWorkflows(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.workflows).toHaveLength(2);
      expect(responseData.data.total).toBe(2);
      expect(responseData.data.page).toBe(1);
      expect(responseData.data.limit).toBe(10);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflows');
    });

    it('should handle search query', async () => {
      const mockWorkflows = [
        {
          id: 'wf-1',
          name: 'Email Workflow',
          description: 'Handles email automation',
          metadata: { author: 'test@example.com', version: 1 },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockOr.mockResolvedValue({
        data: mockWorkflows,
        error: null,
        count: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows?search=email');
      const response = await getWorkflows(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.workflows).toHaveLength(1);
      expect(responseData.data.workflows[0].name).toBe('Email Workflow');
      expect(mockOr).toHaveBeenCalledWith('name.ilike.%email%,description.ilike.%email%');
    });

    it('should handle database errors', async () => {
      mockRange.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows');
      const response = await getWorkflows(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Database connection failed');
    });
  });

  describe('POST /api/workflows - Create Workflow', () => {
    it('should create a new workflow successfully', async () => {
      const mockWorkflow = {
        id: 'wf-new',
        user_id: 'user-123',
        name: 'New Workflow',
        description: 'A new test workflow',
        nodes: [
          { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} },
        ],
        edges: [],
        metadata: { author: 'test@example.com', version: 1, tags: [] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Workflow',
          description: 'A new test workflow',
          nodes: [
            { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} },
          ],
          edges: [],
          metadata: { tags: ['test'] },
        }),
      });

      const response = await createWorkflow(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data.name).toBe('New Workflow');
      expect(responseData.data.metadata.author).toBe('test@example.com');
      expect(responseData.data.metadata.version).toBe(1);
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'New Workflow',
        description: 'A new test workflow',
        nodes: [
          { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} },
        ],
        edges: [],
        metadata: {
          tags: ['test'],
          author: 'test@example.com',
          version: 1,
        },
      });
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing name and nodes',
        }),
      });

      const response = await createWorkflow(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should validate nodes and edges are arrays', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Workflow',
          nodes: 'not-an-array',
          edges: 'not-an-array',
        }),
      });

      const response = await createWorkflow(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Nodes and edges must be arrays');
    });

    it('should handle database insertion errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' },
      });

      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Duplicate Workflow',
          nodes: [],
          edges: [],
        }),
      });

      const response = await createWorkflow(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Unique constraint violation');
    });
  });

  describe('GET /api/workflows/[id] - Get Single Workflow', () => {
    it('should return specific workflow', async () => {
      const mockWorkflow = {
        id: 'wf-123',
        user_id: 'user-123',
        name: 'Specific Workflow',
        description: 'A specific workflow',
        nodes: [
          { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} },
        ],
        edges: [],
        metadata: { author: 'test@example.com', version: 1 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows/wf-123');
      const response = await getWorkflow(request, { params: { id: 'wf-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.id).toBe('wf-123');
      expect(responseData.data.name).toBe('Specific Workflow');
      expect(mockEq).toHaveBeenCalledWith('id', 'wf-123');
    });

    it('should return 404 for non-existent workflow', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows/non-existent');
      const response = await getWorkflow(request, { params: { id: 'non-existent' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Workflow not found');
    });
  });

  describe('PUT /api/workflows/[id] - Update Workflow', () => {
    it('should update workflow successfully', async () => {
      const mockUpdatedWorkflow = {
        id: 'wf-123',
        user_id: 'user-123',
        name: 'Updated Workflow',
        description: 'Updated description',
        nodes: [
          { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} },
          { id: 'node-2', type: 'end', position: { x: 100, y: 0 }, config: {} },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
        ],
        metadata: { author: 'test@example.com', version: 2 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockUpdatedWorkflow,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows/wf-123', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Workflow',
          description: 'Updated description',
          nodes: [
            { id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} },
            { id: 'node-2', type: 'end', position: { x: 100, y: 0 }, config: {} },
          ],
          edges: [
            { id: 'edge-1', source: 'node-1', target: 'node-2' },
          ],
        }),
      });

      const response = await updateWorkflow(request, { params: { id: 'wf-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.name).toBe('Updated Workflow');
      expect(responseData.data.metadata.version).toBe(2);
    });

    it('should validate required fields for update', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows/wf-123', {
        method: 'PUT',
        body: JSON.stringify({
          description: 'Missing name, nodes, and edges',
        }),
      });

      const response = await updateWorkflow(request, { params: { id: 'wf-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/workflows/[id] - Delete Workflow', () => {
    it('should delete workflow successfully', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows/wf-123', {
        method: 'DELETE',
      });

      const response = await deleteWorkflow(request, { params: { id: 'wf-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.message).toBe('Workflow deleted successfully');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'wf-123');
    });

    it('should handle deletion errors', async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      });

      const request = new NextRequest('http://localhost:3000/api/workflows/wf-123', {
        method: 'DELETE',
      });

      const response = await deleteWorkflow(request, { params: { id: 'wf-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Foreign key constraint violation');
    });
  });

  describe('Workflow CRUD Integration Flow', () => {
    it('should complete full CRUD workflow lifecycle', async () => {
      // Create workflow
      const newWorkflow = {
        id: 'wf-lifecycle',
        user_id: 'user-123',
        name: 'Lifecycle Test',
        description: 'Testing full lifecycle',
        nodes: [{ id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} }],
        edges: [],
        metadata: { author: 'test@example.com', version: 1, tags: [] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValueOnce({
        data: newWorkflow,
        error: null,
      });

      const createRequest = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Lifecycle Test',
          description: 'Testing full lifecycle',
          nodes: [{ id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} }],
          edges: [],
        }),
      });

      const createResponse = await createWorkflow(createRequest);
      expect(createResponse.status).toBe(201);

      // Read workflow
      mockSingle.mockResolvedValueOnce({
        data: newWorkflow,
        error: null,
      });

      const readRequest = new NextRequest('http://localhost:3000/api/workflows/wf-lifecycle');
      const readResponse = await getWorkflow(readRequest, { params: { id: 'wf-lifecycle' } });
      expect(readResponse.status).toBe(200);

      // Update workflow
      const updatedWorkflow = {
        ...newWorkflow,
        name: 'Updated Lifecycle Test',
        metadata: { ...newWorkflow.metadata, version: 2 },
      };

      mockSingle.mockResolvedValueOnce({
        data: updatedWorkflow,
        error: null,
      });

      const updateRequest = new NextRequest('http://localhost:3000/api/workflows/wf-lifecycle', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Lifecycle Test',
          description: 'Testing full lifecycle',
          nodes: [{ id: 'node-1', type: 'start', position: { x: 0, y: 0 }, config: {} }],
          edges: [],
        }),
      });

      const updateResponse = await updateWorkflow(updateRequest, { params: { id: 'wf-lifecycle' } });
      expect(updateResponse.status).toBe(200);

      // Delete workflow
      mockEq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const deleteRequest = new NextRequest('http://localhost:3000/api/workflows/wf-lifecycle', {
        method: 'DELETE',
      });

      const deleteResponse = await deleteWorkflow(deleteRequest, { params: { id: 'wf-lifecycle' } });
      expect(deleteResponse.status).toBe(200);
    });
  });
});