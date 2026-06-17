const { Client } = require('pg')
const client = new Client({ connectionString: 'postgres://kinedatabase_user:qhAw3vreUmJa6FdcXsDzVLq2kX4U05BL@dpg-d883v0sm0tmc738ck460-a.oregon-postgres.render.com/kinedatabase?sslmode=require', ssl: { rejectUnauthorized: false } })
async function main() {
  await client.connect()
  const res = await client.query('SELECT id, nom, prenom FROM patient ORDER BY id')
  console.table(res.rows)
  await client.end()
}
main().catch(console.error)
