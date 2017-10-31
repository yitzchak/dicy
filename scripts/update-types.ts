import * as fs from 'fs-extra'
import * as path from 'path'
import toSource from 'tosource'

import { DiCy } from '../packages/core/src/main'
import { Option } from '../packages/core/src/types'

async function main () {
  const filePath = path.join(__dirname, '../packages/core/src/types.js')
  const previous = await fs.readFile(filePath, 'utf8')
  const options: Option[] = await DiCy.getOptionDefinitions()
  const defaultOptions = {}
  const properties = options.map(option => {
    let property: string = option.name.includes('$') ? `'${option.name}'` : option.name

    if (option.type !== 'boolean' && !option.defaultValue && !/^(filePath|jobNames)$/.test(option.name)) {
      property += '?'
    }

    property += ': '

    if (option.values) {
      property += option.values.map(x => toSource(x).replace(/"/g, '\'')).join(' | ')
    } else {
      switch (option.type) {
        case 'strings':
          property += 'Array<string>'
          break
        default:
          property += option.type
          break
      }
    }

    return property
  })

  for (const option of options) {
    if (option.defaultValue) defaultOptions[option.name] = option.defaultValue
  }

  await fs.writeFile(filePath, previous.replace(/\/\/ START_AUTO[^]*?\/\/ END_AUTO/mg,
    `// START_AUTO

export interface OptionsInterface {
  ${properties.join(',\n  ')}
}

export const DEFAULT_OPTIONS = ${toSource(defaultOptions)}

// END_AUTO`), { encoding: 'utf8' })
}

main()
