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

    return ApiResponse.success({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      created_at: user.created_at,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
