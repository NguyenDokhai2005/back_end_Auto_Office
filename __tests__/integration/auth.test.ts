import { NextRequest } from 'next/server';
import { POST as signupHandler } from '@/app/api/auth/signup/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { GET as userHandler } from '@/app/api/auth/user/route';

// Mock Supabase
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      getUser: mockGetUser,
    },
  })),
  getUser: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    created_at: '2024-01-01T00:00:00Z',
  })),
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
  })),
}));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Signup Flow', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        user_metadata: { name: 'New User' },
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        }),
      });

      const response = await signupHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.user.email).toBe('newuser@example.com');
      expect(responseData.data.user.name).toBe('New User');
      expect(responseData.data.session).toBeDefined();
      expect(responseData.data.session.access_token).toBe('mock-access-token');
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: { name: 'New User' },
        },
      });
    });

    it('should handle signup with existing email', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
        }),
      });

      const response = await signupHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('User already registered');
    });

    it('should validate required fields for signup', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing password and name
        }),
      });

      const response = await signupHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should validate email format for signup', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        }),
      });

      const response = await signupHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid email format');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should validate password length for signup', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123', // Too short
          name: 'Test User',
        }),
      });

      const response = await signupHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Password must be at least 6 characters');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await loginHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.user.email).toBe('test@example.com');
      expect(responseData.data.user.name).toBe('Test User');
      expect(responseData.data.session).toBeDefined();
      expect(responseData.data.session.access_token).toBe('mock-access-token');
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login with invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await loginHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid email or password');
    });

    it('should validate required fields for login', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing password
        }),
      });

      const response = await loginHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Missing required fields');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should validate email format for login', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
        }),
      });

      const response = await loginHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid email format');
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout user', async () => {
      mockSignOut.mockResolvedValue({
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.success).toBe(true);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await logoutHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toContain('Logout failed');
    });
  });

  describe('Get User Flow', () => {
    it('should return current user information', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/user', {
        method: 'GET',
      });

      const response = await userHandler(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.id).toBe('user-123');
      expect(responseData.data.email).toBe('test@example.com');
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full signup -> login -> logout flow', async () => {
      // Step 1: Signup
      const mockUser = {
        id: 'user-456',
        email: 'flowtest@example.com',
        user_metadata: { name: 'Flow Test User' },
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const signupRequest = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'flowtest@example.com',
          password: 'password123',
          name: 'Flow Test User',
        }),
      });

      const signupResponse = await signupHandler(signupRequest);
      expect(signupResponse.status).toBe(201);

      // Step 2: Login
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'flowtest@example.com',
          password: 'password123',
        }),
      });

      const loginResponse = await loginHandler(loginRequest);
      expect(loginResponse.status).toBe(200);

      // Step 3: Logout
      mockSignOut.mockResolvedValue({
        error: null,
      });

      const logoutRequest = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const logoutResponse = await logoutHandler(logoutRequest);
      expect(logoutResponse.status).toBe(200);
    });
  });
});