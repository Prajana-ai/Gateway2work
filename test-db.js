const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://impactforge:secret123@127.0.0.1:5436/impactforge_dev",
});
client.connect()
  .then(() => {
    console.log('connected');
    process.exit(0);
  })
  .catch(err => {
    console.error('connection error', err.stack);
    process.exit(1);
  });
