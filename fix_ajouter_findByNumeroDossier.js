const fs = require('fs')
const path = 'src/patients/patients.service.ts'
let content = fs.readFileSync(path, 'utf8')

const regex = /(async findOne\(id: number\): Promise<Patient> \{\s*\n\s*const patient = await this\.repo\.findOne\(\{ where: \{ id \} \}\);\s*\n\s*if \(!patient\) throw new NotFoundException\('Patient introuvable'\);\s*\n\s*return patient;\s*\n\s*\})/

if (!regex.test(content)) {
  console.log('ECHEC: regex findOne non trouvee')
  process.exit(1)
}

content = content.replace(regex, `$1
  async findByNumeroDossier(numeroDossier: string): Promise<Patient | null> {
    return this.repo.findOne({ where: { numeroDossier } });
  }`)

fs.writeFileSync(path, content)
console.log('OK: findByNumeroDossier ajoutee')
