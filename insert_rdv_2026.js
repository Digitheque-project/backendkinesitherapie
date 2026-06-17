const { Client } = require('pg')
const client = new Client({ connectionString: 'postgres://kinedatabase_user:qhAw3vreUmJa6FdcXsDzVLq2kX4U05BL@dpg-d883v0sm0tmc738ck460-a.oregon-postgres.render.com/kinedatabase?sslmode=require', ssl: { rejectUnauthorized: false } })

const rdvs = [
  { date:'2026-06-17', heureDebut:'09:00', heureFin:'10:00', motif:'Consultation initiale',  type:'consultation', statut:'planifie', patientId:1 },
  { date:'2026-06-17', heureDebut:'11:00', heureFin:'12:00', motif:'Récupération post-op',   type:'soin',         statut:'planifie', patientId:101 },
  { date:'2026-06-18', heureDebut:'10:00', heureFin:'10:30', motif:'Bilan de progression',   type:'bilan',        statut:'planifie', patientId:2 },
  { date:'2026-06-19', heureDebut:'14:00', heureFin:'15:00', motif:'Massage sportif',        type:'soin',         statut:'planifie', patientId:3 },
  { date:'2026-06-20', heureDebut:'08:00', heureFin:'09:00', motif:'Rééducation genou',      type:'soin',         statut:'planifie', patientId:4 },
  { date:'2026-06-22', heureDebut:'13:00', heureFin:'14:00', motif:'Séance de stretching',   type:'exercice',     statut:'planifie', patientId:5 },
  { date:'2026-06-25', heureDebut:'15:00', heureFin:'16:00', motif:'Contrôle mensuel',       type:'bilan',        statut:'planifie', patientId:102 },
]

async function main() {
  await client.connect()
  for (const r of rdvs) {
    await client.query(
      `INSERT INTO rendez_vous ("date","heureDebut","heureFin","motif","type","statut","patientId")
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.date, r.heureDebut, r.heureFin, r.motif, r.type, r.statut, r.patientId]
    )
    console.log(`✅ RDV inséré : ${r.motif} - ${r.date}`)
  }
  await client.end()
  console.log('Terminé ! 7 RDV 2026 insérés.')
}
main().catch(console.error)
