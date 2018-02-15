import * as fs from 'fs-extra'

import { Command } from '@dicy/types'

import File from '../File'
import Rule from '../Rule'
import { Phase } from '../types'

export default class Migrate extends Rule {
  static commands: Set<Command> = new Set<Command>(['load'])
  static phases: Set<Phase> = new Set<Phase>(['initialize'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Do migration tasks.'

  async run (): Promise<boolean> {
    await this.moveUserOptions()

    return true
  }

  async moveUserOptions (): Promise<void> {
    const oldPath: string = this.resolvePath('$HOME/.dicy.yaml')

    if (await File.canRead(oldPath)) {
      const newPath: string = this.resolvePath('$CONFIG_HOME/dicy/config.yaml')
      await fs.move(oldPath, newPath)
      this.info(`Moved user options file \`${oldPath}\` to \`${newPath}\`.`)
    }
  }
}
