import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParserMatch, RuleDescription } from '../types'

const TRUE_PATTERN = /^(true|yes|enabled?)$/i
const ITEM_SEPARATOR_PATTERN = /\s*,\s*/

export default class ParseLaTeXMagic extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['load'],
    phases: ['execute'],
    parameters: [[
      'LaTeX', 'LiterateAgda', 'LiterateHaskell', 'PythonNoWeb', 'RNoWeb'
    ]]
  }]
  static defaultActions: Action[] = ['parse']

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedLaTeXMagic')
    const magic: {[name: string]: any} = {}

    await this.firstParameter.parse([{
      names: ['jobName', 'name', 'value'],
      patterns: [/^%\s*!T[eE]X\s+(?:([^:]+?)\s*:\s*)?(\$?\w+)\s*=\s*(.*?)\s*$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        const schema = this.getOptionSchema(match.groups.name)
        let value: any = match.groups.value

        if (schema) {
          // If we have a schema definition then use it to parse the value
          switch (schema.type) {
            case 'variable':
              if (ITEM_SEPARATOR_PATTERN.test(value)) {
                value = value.split(ITEM_SEPARATOR_PATTERN)
              }
              break
            case 'strings':
              value = value.split(ITEM_SEPARATOR_PATTERN)
              break
            case 'number':
              value = parseInt(value, 10)
              break
            case 'boolean':
              value = TRUE_PATTERN.test(value)
              break
          }
        }

        let jobMagic = magic

        if (match.groups.jobName) {
          // There is a job name specified so create a jobs Object.
          if (!('jobs' in magic)) magic.jobs = {}

          if (match.groups.jobName in magic.jobs) {
            jobMagic = magic.jobs[match.groups.jobName]
          } else {
            magic.jobs[match.groups.jobName] = jobMagic = {}
          }
        }

        // Assign the value
        jobMagic[match.groups.name] = value
      }
    }])

    if (output) output.value = magic

    return true
  }
}
