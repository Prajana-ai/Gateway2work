const { Client } = require('pg');
require('dotenv').config();

async function checkMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM public.pgmigrations ORDER BY run_on ASC');
    console.log('Applied Migrations:');
    res.rows.forEach(row => {
      console.log(`${row.id}: ${row.name} (run on ${row.run_on})`);
    });
  } catch (err) {
    console.error('Error querying migrations:', err.message);
  } finally {
    await client.end();
  }
}

checkMigrations();
