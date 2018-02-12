import { Reference } from '@dicy/types'

import Rule from '../Rule'
import { Action, ParserMatch, RuleDescription } from '../types'

export default class ParseLaTeXAuxilary extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['LaTeXAuxilary']]
  }]
  static defaultActions: Action[] = ['parse']

  async parse () {
    const output = await this.getResolvedOutput('$FILEPATH_0-ParsedLaTeXAuxilary')
    if (!output) return false

    const results: { commands: string[] } = {
      commands: []
    }

    // We just need a list of the commands that in the aux file so we know
    // when to run BibTeX and Bib2Gls.
    await this.firstParameter.parse([{
      names: ['command'],
      patterns: [/^\\([A-Za-z@]+)/],
      evaluate: (mode: string, reference: Reference, match: ParserMatch): string | void => {
        results.commands.push(match.groups.command)
      }
    }])

    output.value = results

    return true
  }
}
