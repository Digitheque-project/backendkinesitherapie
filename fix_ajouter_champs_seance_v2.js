const fs = require('fs')
const path = 'src/seances/seance.entity.ts'
let content = fs.readFileSync(path, 'utf8')

// Etape 1 : inserer diagnosticKine + bilan juste avant "traitement: string;"
const regexTraitement = /(@Column\(\{ type: 'text', nullable: true \}\)\s*\n\s*traitement: string;)/

if (!regexTraitement.test(content)) {
  console.log('ECHEC etape 1: regex traitement non trouvee')
  process.exit(1)
}

content = content.replace(regexTraitement, `@Column({ type: 'text', nullable: true })
  diagnosticKine: string;

  @Column({ type: 'text', nullable: true })
  bilan: string;

  $1`)

// Etape 2 : ajouter valide juste avant createdAt
const regexCreatedAt = /(@CreateDateColumn\(\)\s*\n\s*createdAt: Date;)/

if (!regexCreatedAt.test(content)) {
  console.log('ECHEC etape 2: regex createdAt non trouvee')
  process.exit(1)
}

content = content.replace(regexCreatedAt, `@Column({ default: false })
  valide: boolean;

  $1`)

fs.writeFileSync(path, content)
console.log('OK: champs diagnosticKine, bilan et valide ajoutes a Seance')
