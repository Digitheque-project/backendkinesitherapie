const fs = require('fs')
const path = 'src/app.module.ts'
let content = fs.readFileSync(path, 'utf8')

const regexImport = /(import \{ NotificationsModule \} from '\.\/notifications\/notifications\.module';)/

if (!regexImport.test(content)) {
  console.log('ECHEC etape 1: import NotificationsModule non trouve')
  process.exit(1)
}
content = content.replace(regexImport, `$1
import { ServicesExternesModule } from './services-externes/services-externes.module';`)

const regexModule = /(NotificationsModule,)/

if (!regexModule.test(content)) {
  console.log('ECHEC etape 2: NotificationsModule dans imports non trouve')
  process.exit(1)
}
content = content.replace(regexModule, `$1
    ServicesExternesModule,`)

fs.writeFileSync(path, content)
console.log('OK: ServicesExternesModule branche dans AppModule')
