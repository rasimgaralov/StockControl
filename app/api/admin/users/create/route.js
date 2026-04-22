import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function POST(request) {
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

    // Getting payload
    const { email, password, name, username, role, deptId } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Initialize service role client to bypass RLS and create users
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

    // Create user in auth.users
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || username,
        username: username,
        role: role || 'user',
        deptId: deptId || null
      }
    });

    if (createError) {
      return Response.json({ error: createError.message }, { status: 400 });
    }

    return Response.json({ success: true, user: newUser.user }, { status: 201 });
  } catch (err) {
    console.error('User creation error:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
