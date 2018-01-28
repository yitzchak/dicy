import { Command } from '@dicy/types'
import * as path from 'path'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'
import { default as DBus, DBusSignalEmitter } from '../DBus'

const DBUS_NAME: string = 'org.pwmt.zathura.PID-'
const DBUS_PATH: string = '/org/pwmt/zathura'
const DBUS_INTERFACE: string = 'org.pwmt.zathura'

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

function getZathuraFileName (instance: ZathuraInstance): Promise<string | undefined> {
  return instance.get_filename().then(value => value, () => undefined)
}

export default class Zathura extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set([
    'PortableDocumentFormat', 'PostScript'
  ])]
  // static alwaysEvaluate: boolean = true

  static description: string = 'Open targets using zathura.'

  bus: DBus = new DBus()
  instance?: ZathuraInstance

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (process.platform !== 'linux' ||
      parameters.some(file => file.virtual || !consumer.isOutputTarget(file))) {
      return false
    }

    try {
      await consumer.executeCommand({
        command: ['zathura', '--version'],
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
    if (!await super.run()) return false

    const filePath = this.firstParameter.realFilePath

    if (!this.instance || await getZathuraFileName(this.instance) !== filePath) {
      delete this.instance

      for (const name of await this.bus.listNames()) {
        if (name.startsWith(DBUS_NAME)) {
          const instance = await this.bus.getInterface(name, DBUS_PATH, DBUS_INTERFACE)
          const filename = await getZathuraFileName(instance)
          if (filename === filePath) {
            this.instance = instance
            instance.on('Edit', this.onEdit.bind(this))
            break
          }
        }
      }
    }

    return !!this.instance
  }

  onEdit (input: string, line: number, column: number): void {
    this.sync(input, line)
  }

  constructCommand (): CommandOptions {
    const command = ['zathura']

    if (this.options.sourcePath) {
      const sourcePath = path.resolve(this.rootPath, this.options.sourcePath)
      command.push(`--synctex-forward="${this.options.sourceLine}:1:${sourcePath}"`)
    }

    command.push('{{$FILEPATH_0}}')

    return {
      command,
      cd: '$ROOTDIR',
      severity: 'warning',
      spawn: true
    }
  }
}
