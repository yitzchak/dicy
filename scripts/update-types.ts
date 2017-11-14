import * as fs from 'fs-extra'
import * as path from 'path'
import * as _ from 'lodash'
var toSource = require('tosource')

import { getOptionDefinitions, OptionDefinition } from '../packages/types/src/main'

async function main () {
  const filePath = path.join(__dirname, '../packages/types/src/types.ts')
  const previous = await fs.readFile(filePath, 'utf8')
  const options: OptionDefinition[] = await getOptionDefinitions()
  const defaultOptions: any = {}
  const decl: string[] = []
  const properties = ['[name: string]: any'].concat(options.map(option => {
    let property: string = option.name

    if (option.type !== 'boolean' && !option.defaultValue && !/^(filePath|jobNames)$/.test(option.name)) {
      property += '?'
    }

    property += ': '

    if (option.values) {
      const name = _.upperFirst(option.name)
      const values = option.values.map(x => toSource(x).replace(/"/g, '\'')).join(' | ')
      if (name !== 'Severity') decl.push(`export type ${name} = ${values}`)
      property += name
    } else {
      switch (option.type) {
        case 'strings':
          property += 'string[]'
          break
        case 'variable':
          property += 'string | string[]'
          break
        default:
          property += option.type
          break
      }
    }

    return property
  }))

  for (const option of options) {
    if (option.defaultValue) defaultOptions[option.name] = option.defaultValue
  }

  await fs.writeFile(filePath, previous.replace(/\/\/ START_AUTO[^]*?\/\/ END_AUTO/mg,
    `// START_AUTO

${decl.join('\n\n')}

export interface OptionsInterface {
  ${properties.join('\n  ')}
}

export const DEFAULT_OPTIONS = ${toSource(defaultOptions)}

// END_AUTO`), { encoding: 'utf8' })
}

main()
