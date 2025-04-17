import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as csv from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials in .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Usage: node import_csv_to_supabase.js <path-to-csv> <user_id>
async function main() {
  const [,, csvFile, userId] = process.argv;
  if (!csvFile || !userId) {
    console.error('Usage: node import_csv_to_supabase.js <path-to-csv> <user_id>');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvFile, 'utf-8');
  const records = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  for (const row of records) {
    const timestamp = row.timestamp;
    const value = parseInt(row.flowrate, 10);
    const category = row.categorisation || null;

    // Check if a reading already exists for this timestamp and user
    const { data: existing, error: selectErr } = await supabase
      .from('water_readings')
      .select('id')
      .eq('user_id', userId)
      .eq('timestamp', timestamp)
      .maybeSingle();

    if (selectErr) {
      console.error('Error querying Supabase:', selectErr.message);
      continue;
    }
    if (existing) {
      console.log(`Skipping existing reading for ${timestamp}`);
      continue;
    }

    // Insert new reading
    const { error: insertErr } = await supabase
      .from('water_readings')
      .insert({
        user_id: userId,
        timestamp,
        value,
        // You may want to store category elsewhere, e.g. in water_events
      });
    if (insertErr) {
      console.error('Error inserting:', insertErr.message);
    } else {
      console.log(`Inserted reading for ${timestamp}`);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
