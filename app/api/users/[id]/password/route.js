import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(request, { params }) {
  try {
    const supabaseServer = await createServerClient();
    
    // Check if current user is admin
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return Response.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    // Get the dynamic ID from the URL params
    const { id } = await params;
    if (!id) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Getting payload
    const { password, email } = await request.json();

    if (!password && !email) {
      return Response.json({ error: 'Password or email is required' }, { status: 400 });
    }

    // Initialize service role client to bypass RLS and update users
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return Response.json({ error: 'System configuration error (Missing Service Role).' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const updates = {};
    if (password) updates.password = password;
    if (email) updates.email = email;

    // Update user password/email in auth.users
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      updates
    );

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 });
    }

    return Response.json({ success: true, user: updatedUser.user }, { status: 200 });
  } catch (err) {
    console.error('Password update error:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
