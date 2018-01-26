import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'
import { default as DBus, DBusSignalEmitter } from '../DBus'

// const DBUS_NAME: string = 'org.pwmt.zathura.PID-29301'
// const DBUS_PATH: string = 'org/pwmt/zathura'
// const DBUS_INTERFACE: string = 'org.pwmt.zathura'

interface ZathuraRectangle {
  x1: number,
  y1: number,
  x2: number,
  y2: number
}

interface ZathuraSecondaryRectangle {
  page: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
}

interface ZathuraInstance extends DBusSignalEmitter {
  CloseDocument (): Promise<boolean>
  GotoPage (page: number): Promise<boolean>
  HighlightRects (page: number, rectangles: ZathuraRectangle[], secondaryRectangles: ZathuraSecondaryRectangle[]): Promise<boolean>
  OpenDocument (path: string, password: string, page: number): Promise<boolean>
  SynctexView (input: string, line: number, column: number): Promise<boolean>

  get_filename (): Promise<string>
  get_numberofpages (): Promise<number>
  get_pagenumber (): Promise<number>

  on (signal: 'Edit', callback: (input: string, line: number, column: number) => void): void
}

export default class Zathura extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set([
    'PortableDocumentFormat', 'PostScript'
  ])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using zathura.'

  bus: DBus = new DBus()
  instance?: ZathuraInstance

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (process.platform !== 'linux' ||
      parameters.some(file => file.virtual || !consumer.isOutputTarget(file))) {
      return false
    }

    try {
      await consumer.executeProcess({
        args: ['zathura', '--version'],
        cd: '$ROOTDIR',
        severity: 'info'
      })
    } catch (error) {
      return false
    }

    return true
  }

  get group (): Group | undefined {
    return 'opener'
  }

  async run (): Promise<boolean> {
    this.executeCommand(this.constructCommand())

    return true
  }

  constructCommand (): CommandOptions {
    const args = ['zathura']

    if (this.options.sourcePath) {
      const sourcePath = path.resolve(this.rootPath, this.options.sourcePath)
      args.push(`--synctex-forward="${this.options.sourceLine}:1:${sourcePath}"`)
    }

    args.push('{{$FILEPATH_0}}')

    return {
      args,
      cd: '$ROOTDIR',
      severity: 'warning'
    }
  }
}
