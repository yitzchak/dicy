import Rule from '../Rule'
import { RuleDescription } from '../types'

export default class InitializePathCandidates extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['discover'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true

  async run (): Promise<boolean> {
    const year: number = (new Date()).getFullYear()

    switch (process.platform) {
      case 'darwin':
        // Discovery paths for Skim
        await this.createResolvedOutput('$JOB.log-SkimPdfDiscovery', {
          candidates: [
            '$PATH',
            '$PATH:/Applications/Skim.app/Contents/SharedSupport'
          ]
        })

        // Discovery paths for LaTeX
        await this.createResolvedOutput('$JOB.log-LaTeXDiscovery', {
          candidates: [
            '$PATH',
            '$PATH:/usr/texbin',
            '$PATH:/Library/TeX/texbin'
          ]
        })
        break
      case 'win32':
        // Discovery paths for Okular
        await this.createResolvedOutput('$JOB.log-OkularDiscovery', {
          candidates: [
            '$PATH',
            '$PATH;${ProgramFiles(x86)}\\Okular\\bin'
          ]
        })

        // Discovery paths for SumatraPDF
        await this.createResolvedOutput('$JOB.log-SumatraPdfDiscovery', {
          candidates: [
            '$PATH',
            '$PATH;$ProgramFiles\\SumatraPDF',
            '$PATH;${ProgramFiles(x86)}\\SumatraPDF'
          ]
        })

        // Discovery paths for LaTeX
        await this.createResolvedOutput('$JOB.log-LaTeXDiscovery', {
          candidates: [
            '$PATH',
            '$PATH;$ProgramFiles\\MiKTeX 2.9\\miktex\\bin\\x64',
            '$PATH;${ProgramFiles(x86)}\\MiKTeX 2.9\\miktex\\bin'
          ].concat(Array(5).map((value, index) => `$PATH;$SystemDrive\\texlive\\${year - index}\\bin\\win32`))
        })
        break
    }

    return true
  }
}
