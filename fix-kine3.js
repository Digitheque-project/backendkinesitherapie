const { Client } = require('pg')

const client = new Client({
  host: 'dpg-d9msvqjncjis7391un7g-a.oregon-postgres.render.com',
  user: 'kine2_user',
  password: 'FMDDqbtzV2rp0P7xEMVslHH6yYqiS9lh',
  database: 'kine2',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()

  const result = await client.query(
    `UPDATE seance SET kine = $1 WHERE kine = 'Kiné Personnelkine'`,
    ['Kiné Personnel Kine']
  )
  console.log(`${result.rowCount} séance(s) mise(s) à jour.`)

  const verif = await client.query(
    `SELECT id, date, kine FROM seance ORDER BY id`
  )
  console.log(verif.rows)

  await client.end()
}

main().catch(err => {
  console.error('Erreur :', err.message)
  process.exit(1)
})
