/**
 * OAuth Helper Functions
 * Provides utilities for OAuth authentication flow
 */

import { randomBytes } from 'crypto';

/**
 * Generate a random state token for CSRF protection
 * @returns Random state string
 */
export function generateStateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate state token
 * @param receivedState State from OAuth callback
 * @param storedState State stored in session/cookie
 * @returns True if valid
 */
export function validateState(receivedState: string, storedState: string): boolean {
  if (!receivedState || !storedState) {
    return false;
  }
  return receivedState === storedState;
}

/**
 * Extract user info from OAuth provider data
 * @param provider OAuth provider name
 * @param userData Raw user data from provider
 * @returns Normalized user info
 */
export function extractUserInfo(provider: string, userData: any) {
  switch (provider) {
    case 'google':
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email?.split('@')[0],
        avatar_url: userData.picture || userData.avatar_url,
        email_verified: userData.email_verified || false,
        provider: 'google',
      };
    
    default:
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email?.split('@')[0],
        avatar_url: userData.avatar_url,
        email_verified: userData.email_verified || false,
        provider: provider,
      };
  }
}

/**
 * Build OAuth redirect URL
 * @param baseUrl Base callback URL
 * @param params Query parameters
 * @returns Full redirect URL
 */
export function buildRedirectUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

/**
 * Parse OAuth error
 * @param error Error from OAuth provider
 * @returns User-friendly error message
 */
export function parseOAuthError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error_description) {
    return error.error_description;
  }

  if (error?.error) {
    const errorMap: Record<string, string> = {
      'access_denied': 'You denied access to your account',
      'invalid_request': 'Invalid OAuth request',
      'unauthorized_client': 'Application is not authorized',
      'unsupported_response_type': 'OAuth configuration error',
      'invalid_scope': 'Invalid permissions requested',
      'server_error': 'OAuth provider error',
      'temporarily_unavailable': 'OAuth service temporarily unavailable',
    };

    return errorMap[error.error] || `OAuth error: ${error.error}`;
  }

  return 'An unknown OAuth error occurred';
}

/**
 * Validate OAuth callback parameters
 * @param params Callback query parameters
 * @returns Validation result
 */
export function validateCallbackParams(params: {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}): { valid: boolean; error?: string } {
  // Check for OAuth errors
  if (params.error) {
    return {
      valid: false,
      error: params.error_description || params.error,
    };
  }

  // Check for required code parameter
  if (!params.code) {
    return {
      valid: false,
      error: 'Missing authorization code',
    };
  }

  return { valid: true };
}

/**
 * Get OAuth redirect URL from environment
 * @returns Redirect URL
 */
export function getOAuthRedirectUrl(): string {
  const redirectUrl = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL;
  
  if (!redirectUrl) {
    throw new Error('NEXT_PUBLIC_OAUTH_REDIRECT_URL is not configured');
  }

  return redirectUrl;
}

/**
 * Check if email is verified
 * @param userData User data from OAuth provider
 * @returns True if email is verified
 */
export function isEmailVerified(userData: any): boolean {
  return userData.email_verified === true || userData.email_verified === 'true';
}
