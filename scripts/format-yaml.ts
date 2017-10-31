import * as yaml from 'js-yaml'
import * as fs from 'fs-extra'

async function transform () {
  for (const filePath of process.argv.slice(2)) {
    console.log(`Formatting ${filePath}...`)
    const doc = yaml.safeLoad((await fs.readFile(filePath)).toString())
    await fs.writeFile(filePath, yaml.safeDump(doc, { sortKeys: true }))
  }
}

transform()
