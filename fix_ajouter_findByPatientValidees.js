const fs = require('fs')
const path = 'src/seances/seances.service.ts'
let content = fs.readFileSync(path, 'utf8')

const ancien = `  findByPatient(patientId: number): Promise<Seance[]> {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }`

const nouveau = `  findByPatient(patientId: number): Promise<Seance[]> {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }
  findByPatientValidees(patientId: number): Promise<Seance[]> {
    return this.repo.find({
      where: { patientId, valide: true },
      order: { createdAt: 'DESC' },
    });
  }`

if (!content.includes(ancien)) {
  console.log('ECHEC: bloc findByPatient non trouve')
  process.exit(1)
}

content = content.replace(ancien, nouveau)
fs.writeFileSync(path, content)
console.log('OK: findByPatientValidees ajoutee')
