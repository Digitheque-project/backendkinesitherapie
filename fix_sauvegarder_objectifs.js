const fs = require('fs')
const path = 'src/notifications/notifications.service.ts'
let content = fs.readFileSync(path, 'utf8')

const ancien = `        diagnostic: p.diagnostic,
        renseignements: p.renseignements,`

const nouveau = `        diagnostic: p.diagnostic,
        objectifs: p.objectifs,
        renseignements: p.renseignements,`

if (!content.includes(ancien)) {
  console.log('ECHEC: bloc diagnostic/renseignements non trouve')
  process.exit(1)
}

content = content.replace(ancien, nouveau)
fs.writeFileSync(path, content)
console.log('OK: objectifs sauvegarde lors de la synchronisation')
