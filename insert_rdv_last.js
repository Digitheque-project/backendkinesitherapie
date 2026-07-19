const { Client } = require('pg')
const client = new Client({ connectionString: 'postgres://kinedatabase_user:qhAw3vreUmJa6FdcXsDzVLq2kX4U05BL@dpg-d883v0sm0tmc738ck460-a.oregon-postgres.render.com/kinedatabase?sslmode=require', ssl: { rejectUnauthorized: false } })
async function main() {
  await client.connect()
  await client.query(
    `INSERT INTO rendez_vous ("date","heureDebut","heureFin","motif","type","statut","patientId")
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    ['2023-11-28', '13:00', '14:00', 'Contrôle mensuel', 'bilan', 'planifie', 101]
  )
  console.log('✅ RDV inséré : Contrôle mensuel - Sarah Jenkins')
  await client.end()
  console.log('Terminé ! 7 RDV insérés au total.')
}
main().catch(console.error)
