import { NextRequest } from 'next/server';
import { GET as getWorkflows, POST as createWorkflow } from '@/app/api/workflows/route';
import { GET as getExecutions, POST as createExecution } from '@/app/api/executions/route';
import { GET as getSettings, PUT as updateSettings } from '@/app/api/settings/route';

// Mock Supabase with RLS simulation
const mockSupabaseClient = {
  from: jest.fn(),
};

// Mock different users
const mockUsers = {
  user1: { id: 'user-1', email: 'user1@example.com' },
  user2: { id: 'user-2', email: 'user2@example.com' },
  admin: { id: 'admin-1', email: 'admin@example.com' },
};

// Mock data with user ownership
const mockWorkflows = [
  {
    id: 'wf-1',
    user_id: 'user-1',
    name: 'User 1 Workflow',
    description: 'Belongs to user 1',
    nodes: [],
    edges: [],
    metadata: { author: 'user1@example.com' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wf-2',
    user_id: 'user-2',
    name: 'User 2 Workflow',
    description: 'Belongs to user 2',
    nodes: [],
    edges: [],
    metadata: { author: 'user2@example.com' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockExecutions = [
  {
    id: 'exec-1',
    workflow_id: 'wf-1',
    user_id: 'user-1',
    status: 'completed',
    results: { output: 'User 1 result' },
    error: null,
    started_at: '2024-01-01T10:00:00Z',
    completed_at: '2024-01-01T10:05:00Z',
  },
  {
    id: 'exec-2',
    workflow_id: 'wf-2',
    user_id: 'user-2',
    status: 'completed',
    results: { output: 'User 2 result' },
    error: null,
    started_at: '2024-01-01T11:00:00Z',
    completed_at: '2024-01-01T11:05:00Z',
  },
];

const mockSettings = [
  {
    user_id: 'user-1',
    email_config: { smtp_host: 'smtp.user1.com' },
    preferences: { theme: 'dark' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    user_id: 'user-2',
    email_config: { smtp_host: 'smtp.user2.com' },
    preferences: { theme: 'light' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// Simulate RLS by filtering data based on current user
function simulateRLS(data: any[], currentUserId: string, userIdField: string = 'user_id') {
  return data.filter(item => item[userIdField] === currentUserId);
}

// Mock Supabase operations with RLS simulation
function setupMockSupabase(currentUser: any) {
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockUpsert = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockRange = jest.fn();
  const mockSingle = jest.fn();

  mockSupabaseClient.from.mockImplementation((table: string) => {
    let tableData: any[] = [];
    
    switch (table) {
      case 'workflows':
        tableData = simulateRLS(mockWorkflows, currentUser.id);
        break;
      case 'executions':
        tableData = simulateRLS(mockExecutions, currentUser.id);
        break;
      case 'user_settings':
        tableData = simulateRLS(mockSettings, currentUser.id);
        break;
    }

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

    mockUpsert.mockReturnValue({
      select: () => ({
        single: mockSingle,
      }),
    });

    mockEq.mockReturnValue({
      order: mockOrder,
      single: mockSingle,
    });

    mockOrder.mockReturnValue({
      range: mockRange,
    });

    // Mock responses based on RLS-filtered data
    mockRange.mockResolvedValue({
      data: tableData,
      error: null,
      count: tableData.length,
    });

    mockSingle.mockImplementation(() => {
      const item = tableData[0] || null;
      return Promise.resolve({
        data: item,
        error: item ? null : { message: 'Row not found' },
      });
    });

    return {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
    };
  });

  return {
    mockSelect,
    mockInsert,
    mockUpdate,
    mockUpsert,
    mockEq,
    mockOrder,
    mockRange,
    mockSingle,
  };
}

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
  requireAuth: jest.fn(),
}));

describe('Row Level Security (RLS) Policies Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow RLS Policies', () => {
    it('should only return workflows owned by the current user', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      setupMockSupabase(mockUsers.user1);

      const request = new NextRequest('http://localhost:3000/api/workflows');
      const response = await getWorkflows(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.workflows).toHaveLength(1);
      expect(responseData.data.workflows[0].user_id).toBe('user-1');
      expect(responseData.data.workflows[0].name).toBe('User 1 Workflow');
    });

    it('should not return workflows from other users', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user2);

      setupMockSupabase(mockUsers.user2);

      const request = new NextRequest('http://localhost:3000/api/workflows');
      const response = await getWorkflows(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.workflows).toHaveLength(1);
      expect(responseData.data.workflows[0].user_id).toBe('user-2');
      expect(responseData.data.workflows[0].name).toBe('User 2 Workflow');
      
      // Ensure it doesn't contain user-1's workflow
      expect(responseData.data.workflows.find((w: any) => w.user_id === 'user-1')).toBeUndefined();
    });

    it('should allow users to create workflows for themselves', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      const mocks = setupMockSupabase(mockUsers.user1);
      
      const newWorkflow = {
        id: 'wf-new',
        user_id: 'user-1',
        name: 'New Workflow',
        description: 'A new workflow',
        nodes: [],
        edges: [],
        metadata: { author: 'user1@example.com', version: 1, tags: [] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mocks.mockSingle.mockResolvedValue({
        data: newWorkflow,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Workflow',
          description: 'A new workflow',
          nodes: [],
          edges: [],
        }),
      });

      const response = await createWorkflow(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data.user_id).toBe('user-1');
      expect(responseData.data.name).toBe('New Workflow');
      expect(mocks.mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        name: 'New Workflow',
        description: 'A new workflow',
        nodes: [],
        edges: [],
        metadata: {
          author: 'user1@example.com',
          version: 1,
          tags: [],
        },
      });
    });

    it('should prevent users from accessing other users workflows directly', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      setupMockSupabase(mockUsers.user1);

      // Try to access user-2's workflow (should fail due to RLS)
      const request = new NextRequest('http://localhost:3000/api/workflows/wf-2');
      
      // Since RLS would prevent this, the workflow won't be found
      const { GET: getWorkflow } = require('@/app/api/workflows/[id]/route');
      const response = await getWorkflow(request, { params: { id: 'wf-2' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Workflow not found');
    });
  });

  describe('Execution RLS Policies', () => {
    it('should only return executions owned by the current user', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      setupMockSupabase(mockUsers.user1);

      const request = new NextRequest('http://localhost:3000/api/executions');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.executions).toHaveLength(1);
      expect(responseData.data.executions[0].user_id).toBe('user-1');
      expect(responseData.data.executions[0].workflow_id).toBe('wf-1');
    });

    it('should not return executions from other users', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user2);

      setupMockSupabase(mockUsers.user2);

      const request = new NextRequest('http://localhost:3000/api/executions');
      const response = await getExecutions(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.executions).toHaveLength(1);
      expect(responseData.data.executions[0].user_id).toBe('user-2');
      expect(responseData.data.executions[0].workflow_id).toBe('wf-2');
      
      // Ensure it doesn't contain user-1's executions
      expect(responseData.data.executions.find((e: any) => e.user_id === 'user-1')).toBeUndefined();
    });

    it('should allow users to create executions for their own workflows', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      const mocks = setupMockSupabase(mockUsers.user1);
      
      const newExecution = {
        id: 'exec-new',
        workflow_id: 'wf-1', // User 1's workflow
        user_id: 'user-1',
        status: 'running',
        results: null,
        error: null,
        started_at: '2024-01-01T12:00:00Z',
        completed_at: null,
      };

      mocks.mockSingle.mockResolvedValue({
        data: newExecution,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/executions', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: 'wf-1',
          status: 'running',
        }),
      });

      const response = await createExecution(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data.user_id).toBe('user-1');
      expect(responseData.data.workflow_id).toBe('wf-1');
      expect(mocks.mockInsert).toHaveBeenCalledWith({
        workflow_id: 'wf-1',
        user_id: 'user-1',
        status: 'running',
        results: null,
        error: null,
      });
    });

    it('should prevent users from creating executions for other users workflows', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      const mocks = setupMockSupabase(mockUsers.user1);
      
      // Mock foreign key constraint violation (workflow doesn't exist for this user)
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      });

      const request = new NextRequest('http://localhost:3000/api/executions', {
        method: 'POST',
        body: JSON.stringify({
          workflow_id: 'wf-2', // User 2's workflow
          status: 'running',
        }),
      });

      const response = await createExecution(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Foreign key constraint violation');
    });
  });

  describe('User Settings RLS Policies', () => {
    it('should only return settings for the current user', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      const mocks = setupMockSupabase(mockUsers.user1);

      const request = new NextRequest('http://localhost:3000/api/settings');
      const response = await getSettings(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.user_id).toBe('user-1');
      expect(responseData.data.email_config.smtp_host).toBe('smtp.user1.com');
      expect(responseData.data.preferences.theme).toBe('dark');
    });

    it('should not return settings from other users', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user2);

      const mocks = setupMockSupabase(mockUsers.user2);

      const request = new NextRequest('http://localhost:3000/api/settings');
      const response = await getSettings(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.user_id).toBe('user-2');
      expect(responseData.data.email_config.smtp_host).toBe('smtp.user2.com');
      expect(responseData.data.preferences.theme).toBe('light');
      
      // Ensure it's not user-1's settings
      expect(responseData.data.email_config.smtp_host).not.toBe('smtp.user1.com');
    });

    it('should allow users to update their own settings', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      const mocks = setupMockSupabase(mockUsers.user1);
      
      const updatedSettings = {
        user_id: 'user-1',
        email_config: { smtp_host: 'smtp.updated.com' },
        preferences: { theme: 'light', notifications: true },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mocks.mockSingle.mockResolvedValue({
        data: updatedSettings,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          email_config: { smtp_host: 'smtp.updated.com' },
          preferences: { theme: 'light', notifications: true },
        }),
      });

      const response = await updateSettings(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.user_id).toBe('user-1');
      expect(responseData.data.email_config.smtp_host).toBe('smtp.updated.com');
      expect(responseData.data.preferences.theme).toBe('light');
      expect(mocks.mockUpsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        email_config: { smtp_host: 'smtp.updated.com' },
        preferences: { theme: 'light', notifications: true },
      });
    });
  });

  describe('Cross-User Data Isolation', () => {
    it('should maintain complete data isolation between users', async () => {
      // Test with user 1
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockResolvedValue(mockUsers.user1);

      setupMockSupabase(mockUsers.user1);

      const user1WorkflowsRequest = new NextRequest('http://localhost:3000/api/workflows');
      const user1WorkflowsResponse = await getWorkflows(user1WorkflowsRequest);
      const user1WorkflowsData = await user1WorkflowsResponse.json();

      const user1ExecutionsRequest = new NextRequest('http://localhost:3000/api/executions');
      const user1ExecutionsResponse = await getExecutions(user1ExecutionsRequest);
      const user1ExecutionsData = await user1ExecutionsResponse.json();

      // Test with user 2
      requireAuth.mockResolvedValue(mockUsers.user2);
      setupMockSupabase(mockUsers.user2);

      const user2WorkflowsRequest = new NextRequest('http://localhost:3000/api/workflows');
      const user2WorkflowsResponse = await getWorkflows(user2WorkflowsRequest);
      const user2WorkflowsData = await user2WorkflowsResponse.json();

      const user2ExecutionsRequest = new NextRequest('http://localhost:3000/api/executions');
      const user2ExecutionsResponse = await getExecutions(user2ExecutionsRequest);
      const user2ExecutionsData = await user2ExecutionsResponse.json();

      // Verify complete isolation
      expect(user1WorkflowsData.data.workflows).toHaveLength(1);
      expect(user1WorkflowsData.data.workflows[0].user_id).toBe('user-1');
      
      expect(user2WorkflowsData.data.workflows).toHaveLength(1);
      expect(user2WorkflowsData.data.workflows[0].user_id).toBe('user-2');

      expect(user1ExecutionsData.data.executions).toHaveLength(1);
      expect(user1ExecutionsData.data.executions[0].user_id).toBe('user-1');
      
      expect(user2ExecutionsData.data.executions).toHaveLength(1);
      expect(user2ExecutionsData.data.executions[0].user_id).toBe('user-2');

      // Ensure no cross-contamination
      const user1WorkflowIds = user1WorkflowsData.data.workflows.map((w: any) => w.id);
      const user2WorkflowIds = user2WorkflowsData.data.workflows.map((w: any) => w.id);
      
      expect(user1WorkflowIds).not.toEqual(expect.arrayContaining(user2WorkflowIds));
      expect(user2WorkflowIds).not.toEqual(expect.arrayContaining(user1WorkflowIds));
    });
  });

  describe('Authentication Required', () => {
    it('should reject requests without authentication', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockRejectedValue(new Error('Unauthorized'));

      const endpoints = [
        { handler: getWorkflows, url: 'http://localhost:3000/api/workflows' },
        { handler: getExecutions, url: 'http://localhost:3000/api/executions' },
        { handler: getSettings, url: 'http://localhost:3000/api/settings' },
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url);
        const response = await endpoint.handler(request);
        
        expect(response.status).toBe(401);
      }
    });

    it('should reject requests with invalid authentication', async () => {
      const { requireAuth } = require('@/lib/supabase/server');
      requireAuth.mockRejectedValue(new Error('Invalid token'));

      const request = new NextRequest('http://localhost:3000/api/workflows');
      const response = await getWorkflows(request);
      
      expect(response.status).toBe(401);
    });
  });
});