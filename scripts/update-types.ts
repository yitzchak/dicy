import * as fs from 'fs-extra'
import * as path from 'path'
import * as _ from 'lodash'
var toSource = require('tosource')

import { getOptionDefinitions, OptionDefinition } from '../packages/types/src/main'

function createProperty (option: OptionDefinition, allOptional: boolean = false): string {
  let property: string = option.name

  if (allOptional || (option.type !== 'boolean' && option.defaultValue === undefined && !/^(filePath|jobNames?)$/.test(option.name))) {
    property += '?'
  }

  property += ': '

  if (option.values) {
    property += _.upperFirst(option.name)
  } else {
    switch (option.type) {
      case 'strings':
        property += option.name === 'jobNames' ? '(string | null)[]' : 'string[]'
        break
      case 'variable':
        property += 'string | string[]'
        break
      default:
        property += option.name === 'jobName' ? 'string | null' : option.type
        break
    }
  }

  return property
}

async function main () {
  const filePath = path.join(__dirname, '../packages/types/src/types.ts')
  const previous = await fs.readFile(filePath, 'utf8')
  const options: OptionDefinition[] = await getOptionDefinitions()
  const defaultOptions: any = {}
  const decl: string[] = options
    .filter(option => option.name !== 'severity' && option.values)
    .map(option => {
      const name = _.upperFirst(option.name)
      const values = (option.values || []).map(x => toSource(x).replace(/"/g, '\'')).join(' | ')
      return `export type ${name} = ${values}`
    })
  const interfaceProperties: string[] = ['[name: string]: any'].concat(options.map(option => createProperty(option)))
  const jobProperties: string[] = ['[name: string]: any'].concat(options.filter(option => !option.name.startsWith('jobName')).map(option => createProperty(option, true)))

  for (const option of options) {
    if (option.defaultValue !== undefined) defaultOptions[option.name] = option.defaultValue
  }

  await fs.writeFile(filePath, previous.replace(/\/\/ START_AUTO[^]*?\/\/ END_AUTO/mg,
    `// START_AUTO

${decl.join('\n\n')}

export interface OptionsInterface {
  ${interfaceProperties.join('\n  ')}
}

export interface JobOptions {
  ${jobProperties.join('\n  ')}
}

export interface OptionsSource extends JobOptions {
  jobName?: string
  jobNames?: string[]
  jobs?: { [ jobName: string]: JobOptions }
}

export const DEFAULT_OPTIONS = ${toSource(defaultOptions)}

// END_AUTO`), { encoding: 'utf8' })
}

main()
