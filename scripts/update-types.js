/* @flow */

import fs from 'fs-extra'
import path from 'path'
import toSource from 'tosource'

import { DiCy } from '../packages/core/src/main'
import type { Option } from '../packages/core/src/types'

async function main () {
  const file = await fs.open(path.join(__dirname, '../packages/core/src/types-auto.js'), 'w')
  const options: Array<Option> = await DiCy.getOptionDefinitions()
  const defaultOptions = {}
  const properties = ['[name: string]: string | Array<string>'].concat(options.filter(option => !/^(\$.*|jobNames)$/.test(option.name)).map(option => {
    let property: string = option.name.includes('$') ? `'${option.name}'` : option.name

    if (!option.defaultValue) {
      property += '?'
    }

    property += ': '

    if (option.values) {
      property += option.values.map(x => toSource(x)).join(' | ')
    } else {
      switch (option.type) {
        case 'numbers':
          property += 'Array<number>'
          break
        case 'strings':
          property += 'Array<string>'
          break
        default:
          property += option.type
          break
      }
    }

    return property
  }))

  await fs.write(file, `/* @flow */

export type JobOptions = {
  ${properties.join(',\n  ')}
}

export type StateOptions = {
  jobs?: { [job: string]: JobOptions },
  jobNames?: Array<string>,
  ${properties.join(',\n  ')}
}

export interface OptionInterface {
  ${properties.join(',\n  ')}
}

export const DEFAULT_OPTIONS = ${toSource(defaultOptions)}
`)
}

main()
