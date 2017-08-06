/* @flow */

import yaml from 'js-yaml'
import fs from 'fs-extra'

async function transform () {
  for (const filePath of process.argv.slice(2)) {
    console.log(`Formatting ${filePath}...`)
    const doc = yaml.safeLoad(await fs.readFile(filePath))
    await fs.writeFile(filePath, yaml.safeDump(doc, { sortKeys: true }))
  }
}

transform()
