import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { name, username, email, password, role } = await request.json();

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: 'Name, username, password and role are required' }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = 'u' + Date.now();

    const { data, error } = await supabase
      .from('users')
      .insert([{ id, name, username, email, password_hash, role }])
      .select('id, name, username, email, role, deptId');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
