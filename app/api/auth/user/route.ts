import { NextRequest } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return ApiResponse.unauthorized();
    }

    // Determine auth provider
    const provider = user.app_metadata?.provider || 'email';
    
    // Get user metadata
    const name = user.user_metadata?.full_name 
      || user.user_metadata?.name 
      || user.email?.split('@')[0];
    
    const avatarUrl = user.user_metadata?.avatar_url 
      || user.user_metadata?.picture;

    return ApiResponse.success({
      id: user.id,
      email: user.email,
      name: name,
      avatar_url: avatarUrl,
      provider: provider,
      email_verified: user.email_confirmed_at ? true : false,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
