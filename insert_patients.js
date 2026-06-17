const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://kinedatabase_user:qhAw3vreUmJa6FdcXsDzVLq2kX4U05BL@dpg-d883v0sm0tmc738ck460-a.oregon-postgres.render.com/kinedatabase',
  ssl: { rejectUnauthorized: false }
})

const patients = [
  { id: 1, numeroDossier: 'P-2024-001', nom: 'Rakoto', prenom: 'Jean', dateNaissance: '1985-03-12', sexe: 'M', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 01', diagnostic: 'Rupture LCA genou droit - post-operatoire', statut: 'actif', dateAdmission: '2024-04-12', dateDerniereVisite: '2024-06-08', antecedents: 'Aucun antecedent' },
  { id: 2, numeroDossier: 'P-2024-002', nom: 'Rabe', prenom: 'Marie', dateNaissance: '1992-07-23', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 02', diagnostic: 'Tendinite calcifiante epaule droite', statut: 'actif', dateAdmission: '2024-04-18', dateDerniereVisite: '2024-06-05', antecedents: 'Aucun antecedent' },
  { id: 3, numeroDossier: 'P-2024-003', nom: 'Andria', prenom: 'Paul', dateNaissance: '1978-11-08', sexe: 'M', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 03', diagnostic: 'Entorse cheville gauche grade 2', statut: 'actif', dateAdmission: '2024-04-22', dateDerniereVisite: '2024-06-09', antecedents: 'Aucun antecedent' },
  { id: 4, numeroDossier: 'P-2024-004', nom: 'Rasoa', prenom: 'Lala', dateNaissance: '1965-05-30', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 04', diagnostic: 'Arthrose lombaire chronique', statut: 'actif', dateAdmission: '2024-05-02', dateDerniereVisite: '', antecedents: 'Aucun antecedent' },
  { id: 5, numeroDossier: 'P-2024-005', nom: 'Rakotonirina', prenom: 'Zo', dateNaissance: '2001-09-15', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 05', diagnostic: 'Scoliose thoracique - suivi', statut: 'inactif', dateAdmission: '2024-03-10', dateDerniereVisite: '2024-05-28', antecedents: 'Aucun antecedent' },
  { id: 6, numeroDossier: 'P-2024-006', nom: 'Randriamihaingo', prenom: 'Tiana', dateNaissance: '1988-02-20', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 000 06', diagnostic: 'Paralysie faciale peripherique droite', statut: 'en_attente', dateAdmission: '2024-06-08', dateDerniereVisite: '', antecedents: 'Aucun antecedent' },
  { id: 101, numeroDossier: 'P-2024-101', nom: 'Jenkins', prenom: 'Sarah', dateNaissance: '1990-05-14', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 001 01', diagnostic: 'Suivi Post-operatoire Genou', statut: 'actif', dateAdmission: '2024-03-01', dateDerniereVisite: '2024-06-10', antecedents: 'Operation genou droit mars 2024' },
  { id: 102, numeroDossier: 'P-2024-102', nom: 'Chen', prenom: 'Michael', dateNaissance: '1983-11-22', sexe: 'M', adresse: 'Fianarantsoa', telephone: '+261 34 00 001 02', diagnostic: 'Consultation Initial Dos', statut: 'en_attente', dateAdmission: '2024-06-09', dateDerniereVisite: '', antecedents: 'Douleurs lombaires chroniques' },
  { id: 103, numeroDossier: 'P-2024-103', nom: 'Rodriguez', prenom: 'Elena', dateNaissance: '1981-03-08', sexe: 'F', adresse: 'Fianarantsoa', telephone: '+261 34 00 001 03', diagnostic: 'Reeducation Epaule', statut: 'actif', dateAdmission: '2024-04-15', dateDerniereVisite: '2024-06-12', antecedents: 'Rupture partielle coiffe des rotateurs' },
]

async function run() {
  await client.connect()
  console.log('Connecte a PostgreSQL')

  for (const p of patients) {
    await client.query(`
      INSERT INTO patient (id, "numeroDossier", nom, prenom, "dateNaissance", sexe, adresse, telephone, diagnostic, statut, "dateAdmission", "dateDerniereVisite", antecedents)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (id) DO UPDATE SET
        "numeroDossier" = EXCLUDED."numeroDossier",
        nom = EXCLUDED.nom,
        prenom = EXCLUDED.prenom,
        "dateNaissance" = EXCLUDED."dateNaissance",
        sexe = EXCLUDED.sexe,
        adresse = EXCLUDED.adresse,
        telephone = EXCLUDED.telephone,
        diagnostic = EXCLUDED.diagnostic,
        statut = EXCLUDED.statut,
        "dateAdmission" = EXCLUDED."dateAdmission",
        "dateDerniereVisite" = EXCLUDED."dateDerniereVisite",
        antecedents = EXCLUDED.antecedents
    `, [p.id, p.numeroDossier, p.nom, p.prenom, p.dateNaissance, p.sexe, p.adresse, p.telephone, p.diagnostic, p.statut, p.dateAdmission, p.dateDerniereVisite || null, p.antecedents])
    console.log(`OK - ${p.prenom} ${p.nom}`)
  }

  // Mettre a jour la sequence pour eviter les conflits d ID
  await client.query(`SELECT setval('patient_id_seq', 200)`)
  console.log('Sequence mise a jour')

  await client.end()
  console.log('Termine ! 9 patients inseres.')
}

run().catch(console.error)
