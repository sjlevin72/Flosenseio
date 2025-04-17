import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const username = 'demo_user_' + Math.floor(Math.random() * 1000000);
  const password = 'password123';
  const { data, error } = await supabase
    .from('users')
    .insert({ username, password })
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
  if (!data) {
    console.error('No user created.');
    process.exit(1);
  }
  console.log('Created demo user:', username, 'with id:', data.id);
}

main();
