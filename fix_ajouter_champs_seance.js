const fs = require('fs')
const path = 'src/seances/seance.entity.ts'
let content = fs.readFileSync(path, 'utf8')

const ancien = `  @Column({ type: 'text', nullable: true })
  traitement: string;
 
  @Column({ type: 'text', nullable: true })
  evolution: string;`

const nouveau = `  @Column({ type: 'text', nullable: true })
  diagnosticKine: string;

  @Column({ type: 'text', nullable: true })
  bilan: string;

  @Column({ type: 'text', nullable: true })
  traitement: string;

  @Column({ type: 'text', nullable: true })
  evolution: string;`

if (!content.includes(ancien)) {
  console.log('ECHEC etape 1: bloc traitement/evolution non trouve')
  process.exit(1)
}
content = content.replace(ancien, nouveau)

const ancienConseil = `  @Column({ nullable: true })
  kine: string;
  @CreateDateColumn()
  createdAt: Date;`

const nouveauConseil = `  @Column({ nullable: true })
  kine: string;

  @Column({ default: false })
  valide: boolean;

  @CreateDateColumn()
  createdAt: Date;`

if (!content.includes(ancienConseil)) {
  console.log('ECHEC etape 2: bloc kine/createdAt non trouve')
  process.exit(1)
}
content = content.replace(ancienConseil, nouveauConseil)

fs.writeFileSync(path, content)
console.log('OK: champs diagnosticKine, bilan et valide ajoutes a Seance')
