import { Command, Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParserMatch } from '../types'

export default class ParseAtomEnabledPackages extends Rule {
  static parameterTypes: Set<string>[] = [new Set<string>(['AtomEnabledPackages'])]
  static commands: Set<Command> = new Set<Command>(['open'])
  static defaultActions: Action[] = ['parse']
  static description: string = 'Parses list of Atom enabled packages.'

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
