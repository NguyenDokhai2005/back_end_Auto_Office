import { NextRequest } from 'next/server';
import { requireAuth, createServiceClient } from '@/lib/supabase/server';
import { ApiResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();

    // Fetch user settings
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If settings don't exist, return default settings
      if (error.code === 'PGRST116') {
        return ApiResponse.success({
          user_id: user.id,
          email_config: null,
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return ApiResponse.error(error.message, 500);
    }

    return ApiResponse.success(data);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();
    const body = await request.json();

    const { email_config, preferences } = body;

    // Validate email_config if provided
    if (email_config !== undefined && email_config !== null) {
      const { smtp_host, smtp_port, from_email } = email_config;
      
      if (!smtp_host || !smtp_port || !from_email) {
        return ApiResponse.badRequest('email_config must include smtp_host, smtp_port, and from_email');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(from_email)) {
        return ApiResponse.badRequest('Invalid email format for from_email');
      }

      // Validate port number
      if (typeof smtp_port !== 'number' || smtp_port < 1 || smtp_port > 65535) {
        return ApiResponse.badRequest('smtp_port must be a number between 1 and 65535');
      }
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (email_config !== undefined) {
      updates.email_config = email_config;
    }

    if (preferences !== undefined) {
      updates.preferences = preferences;
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let data, error;

    if (existingSettings) {
      // Update existing settings
      const result = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new settings
      const result = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          email_config: email_config || null,
          preferences: preferences || {},
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      return ApiResponse.error(error.message, 500);
    }

    return ApiResponse.success(data);
  } catch (error) {
    return errorResponse(error);
  }
}
