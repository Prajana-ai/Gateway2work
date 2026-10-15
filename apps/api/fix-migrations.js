const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// In Azure Pipelines, DATABASE_URL is provided via environment variables.
// In local dev, we load from .env.
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

async function synchronize() {
  const migrationsDir = path.resolve(__dirname, 'src/database/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => f.replace('.sql', ''))
    .sort();

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('azure') 
      ? { rejectUnauthorized: false } 
      : false
  });

  await client.connect();

  try {
    // 1. Get currently "run" migrations from the DB
    const res = await client.query('SELECT name FROM public.pgmigrations');
    const dbBases = res.rows.map(r => r.name.replace(/^\d+[_-]/, ''));

    console.log(`Found ${dbBases.length} applied migrations in database.`);

    await client.query('BEGIN');
    
    // 2. Clear the tracking table
    console.log('Clearing pgmigrations table for synchronization...');
    await client.query('DELETE FROM public.pgmigrations');

    // 3. Re-insert migrations that were already run, using the NEW names/prefixes
    console.log('Re-inserting synchronized migration records...');
    let count = 0;
    for (const file of files) {
      const fileBase = file.replace(/^\d+[_-]/, '');
      if (dbBases.includes(fileBase)) {
        await client.query('INSERT INTO public.pgmigrations (name, run_on) VALUES ($1, NOW())', [file]);
        count++;
      }
    }

    await client.query('COMMIT');
    console.log(`\nSynchronization complete. ${count} records re-aligned.`);
    console.log('You can now run database migrations safely.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('FAILED to synchronize migrations:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

synchronize();
