import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import { RuleDescription } from '../types'

export default class SavePathDiscovery extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['discover'],
    phases: ['finalize']
  }]

  async run (): Promise<boolean> {
    const files: File[] = await this.getResolvedInputs([
      '$JOB.log-SumatraPdfDiscovery'
    ])

    const paths: Set<string> = new Set<string>()

    for (const file of files) {
      if (file.value && file.value.current) {
        file.value.current.toString().split(path.delimiter)
          .filter((p: string) => p && p !== '$PATH')
          .forEach((p: string) => paths.add(p))
      }
    }

    const $PATH = ['$PATH'].concat(Array.from(paths.values())).join(path.delimiter)

    await this.setUserOptions({ $PATH }, true)

    return true
  }
}
