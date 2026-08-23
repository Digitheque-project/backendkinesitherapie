const fs = require('fs')
const path = 'src/services-externes/services-externes.controller.ts'
let content = fs.readFileSync(path, 'utf8')

const ancien = `@Controller('kine/api/services/patients')`
const nouveau = `@Controller('services/patients')`

if (!content.includes(ancien)) {
  console.log('ECHEC: decorateur Controller non trouve')
  process.exit(1)
}

content = content.replace(ancien, nouveau)
fs.writeFileSync(path, content)
console.log('OK: prefixe corrige')
