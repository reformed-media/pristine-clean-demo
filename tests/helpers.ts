import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export const admin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export const testEmail = () => `test+${Date.now()}@reformed.media`;

export async function cleanupTestUsers() {
  const { data } = await admin.auth.admin.listUsers();
  const testUsers = data.users.filter(u => u.email?.startsWith('test+'));
  for (const u of testUsers) {
    // Delete related clients/vehicles/bookings first (cascade handles most)
    await admin.from('clients').delete().eq('auth_user_id', u.id);
    await admin.auth.admin.deleteUser(u.id);
  }
}
