import * as fs from 'fs-extra'

import File from '../File'
import Rule from '../Rule'
import { Action, RuleDescription } from '../types'

export default class Migrate extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['load'],
    phases: ['initialize']
  }]
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true

  getActions (file?: File): Action[] {
    return this.options.migration ? ['run'] : []
  }

  async run (): Promise<boolean> {
    await this.moveUserOptions()

    return true
  }

  async moveUserOptions (): Promise<void> {
    const oldPath: string = this.resolvePath('$HOME/.dicy.yaml')
    const newPath: string = this.resolvePath('$CONFIG_HOME/dicy/config.yaml')

    if (await File.canRead(oldPath)) {
      if (await File.canRead(newPath)) {
        this.warning(`Unable to migrate user options from \`${oldPath}\` since \`${newPath}\` already exists.`)
      } else {
        await fs.move(oldPath, newPath)
        this.info(`Moved user options file \`${oldPath}\` to \`${newPath}\`.`)
      }
    }
  }
}
