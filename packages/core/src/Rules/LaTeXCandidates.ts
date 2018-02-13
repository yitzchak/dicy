import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase, RuleDescription } from '../types'

export default class LaTeXCandidates extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['discover'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return process.platform === 'win32' || process.platform === 'darwin'
  }

  async run (): Promise<boolean> {
    const candidates: string[] = ['$PATH']

    switch (process.platform) {
      case 'win32':
        const year: number = (new Date()).getFullYear()
        candidates.push('$PATH;$ProgramFiles\\MiKTeX 2.9\\miktex\\bin\\x64',
          '$PATH;${ProgramFiles(x86)}\\MiKTeX 2.9\\miktex\\bin')

        for (let i = 0; i < 5; i++) {
          candidates.push(`$PATH;$SystemDrive\\texlive\\${year - i}\\bin\\win32`)
        }

        break
      case 'darwin':
        candidates.push('$PATH:/usr/texbin', '$PATH:/Library/TeX/texbin')
        break
    }

    await this.createResolvedOutput('$JOB.log-LaTeXDiscovery', { candidates })

    return true
  }
}
