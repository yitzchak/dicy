import * as fs from 'fs'
import * as path from 'path'

var ref = JSON.parse(fs.readFileSync('../../package.json', 'utf8'))
var me = JSON.parse(fs.readFileSync('package.json', 'utf8'))

function updateDependencies (me: any , ref: any) {
  var updated = false
  for (var name in me) {
    if (name in ref && me[name] !== ref[name]) {
      me[name] = ref[name]
      updated = true
    }
  }
  return updated
}

if (updateDependencies(me.dependencies, ref.dependencies) || updateDependencies(me.devDependencies, ref.devDependencies)) {
  console.log('Updating dependencies for ' + path.basename(process.cwd()))
  fs.writeFileSync('package.json', JSON.stringify(me, null, 2) + '\n')
}
