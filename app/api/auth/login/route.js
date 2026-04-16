import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 });
    }

    // Fetch user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return Response.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 });
    }

    // Verify password with bcryptjs
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return Response.json({ error: 'Şifre yanlış' }, { status: 401 });
    }

    // Return user info (without password_hash)
    const { password_hash, ...safeUser } = user;
    return Response.json({ user: safeUser }, { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
