import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParserMatch, RuleDescription } from '../types'

export default class ParseAtomEnabledPackages extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['open'],
    phases: ['initialize'],
    parameters: [['AtomEnabledPackages']]
  }]
  static defaultActions: Action[] = ['parse']

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedAtomEnabledPackages')
    if (!output) return false

    const packages: any = {}

    await this.firstParameter.parse([{
      names: ['name', 'version'],
      patterns: [/^([^@]+)@(.*)$/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        packages[match.groups.name] = match.groups.version
      }
    }])

    output.value = packages

    return true
  }
}
