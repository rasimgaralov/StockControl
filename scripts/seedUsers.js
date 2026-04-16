const bcrypt = require('bcryptjs');

const USERS = [
  { id: 'u1', name: 'Ruslan Garalov', username: 'ruslan', password: 'ruslan123', email: 'ruslan@gulf.com', role: 'admin' },
  { id: 'u2', name: 'Tariq Al Dhyiab', username: 'tariq', password: 'tariq123', email: 'tariq@gulf.com', role: 'user' },
  { id: 'u3', name: 'Elie Anoun', username: 'elie', password: 'elie123', email: 'elie@gulf.com', role: 'manager' },
  { id: 'u4', name: 'Mucahid Eser', username: 'mucahid', password: 'mucahid123', email: 'mucahid@gulf.com', role: 'user' },
  { id: 'u5', name: 'Emrullah Hacat', username: 'emrullah', password: 'emrullah123', email: 'emrullah@gulf.com', role: 'user' },
  { id: 'u6', name: 'Supervisor MCT', username: 'supervisor', password: 'supervisor123', email: 'supervisor@gulf.com', role: 'user' },
  { id: 'u7', name: 'James Mark', username: 'james', password: 'james123', email: 'james@gulf.com', role: 'editor' },
];

async function run() {
  console.log('-- Copy and paste this SQL into Supabase SQL Editor:\n');
  console.log('-- Step 1: Delete existing users');
  console.log('DELETE FROM "users";');
  console.log('');
  console.log('-- Step 2: Insert new users with hashed passwords');

  for (const user of USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    const escapedHash = hash.replace(/'/g, "''");
    console.log(`INSERT INTO "users" ("id", "name", "username", "password_hash", "email", "role") VALUES ('${user.id}', '${user.name}', '${user.username}', '${escapedHash}', '${user.email}', '${user.role}');`);
  }

  console.log('');
  console.log('-- Step 3: Reload schema cache');
  console.log("NOTIFY pgrst, 'reload schema';");
  console.log('');
  console.log('-- Step 4: Verify');
  console.log('SELECT "id", "name", "username", "role" FROM "users";');
}

run();
