const fs = require('fs')
const path = 'src/notifications/notification.entity.ts'
let content = fs.readFileSync(path, 'utf8')

const regex = /(@Column\(\{ nullable: true \}\)\s*\n\s*diagnostic: string;)/

if (!regex.test(content)) {
  console.log('ECHEC: regex diagnostic non trouvee')
  process.exit(1)
}

content = content.replace(regex, `$1
  @Column({ type: 'text', nullable: true })
  objectifs: string;`)

fs.writeFileSync(path, content)
console.log('OK: champ objectifs ajoute a Notification')
