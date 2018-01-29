import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'

export default class Skim extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set([
    'DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript'
  ])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using Skim.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (process.platform === 'darwin' &&
      parameters.every(file => !file.virtual && consumer.isOutputTarget(file))) {
      try {
        const { stdout } = await consumer.executeCommand(this.constructScript('get version of application "Skim"'))
        return !!stdout
      } catch (error) {
        return false
      }
    }

    return false
  }

  get group (): Group | undefined {
    return 'opener'
  }

  static constructScript (script: string): CommandOptions {
    return {
      command: ['osascript', '-e', script],
      cd: '$ROOTDIR',
      severity: 'warning'
    }
  }

  constructCommand (): CommandOptions {
    const forwardSync: string = this.options.sourcePath
      ? `
  set theSource to POSIX file "${this.options.sourcePath}"
  set theLine to "${this.options.sourceLine.toString()}" as integer
  tell front document to go to TeX line theLine from theSource`
      : ''

    const script: string = `
set theFile to POSIX file "${this.firstParameter.realFilePath}"
set thePath to POSIX path of (theFile as alias)
tell application "Skim"
  if ${!this.options.openInBackground} then activate
  try
    set theDocs to get documents whose path is thePath
    if (count of theDocs) > 0 then revert theDocs
  end try
  open theFile
  ${forwardSync}
end tell`

  return Skim.constructScript(script)
  }
}
