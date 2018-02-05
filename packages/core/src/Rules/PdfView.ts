import { Command } from '@dicy/types'
import * as path from 'path'
import * as url from 'url'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { CommandOptions, Group, Phase } from '../types'

const PDF_VIEW_PATTERN = /^pdf-view@/m

export default class PdfView extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set([
    'DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript',
    'ScalableVectorGraphics'
  ])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using Atom\'s pdf-view.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (parameters.some(file => file.virtual || !consumer.isOutputTarget(file))) {
      return false
    }

    try {
      const { stdout } = await consumer.executeCommand({
        command: ['apm', 'list', '--installed', '--packages', '--enabled', '--bare'],
        cd: '$ROOTDIR',
        severity: 'info',
        stdout: true
      })
      return PDF_VIEW_PATTERN.test(stdout.toString())
    } catch (error) {
      return false
    }
  }

  get group (): Group | undefined {
    return 'opener'
  }

  constructCommand (): CommandOptions {
    const query: { [key: string]: string | string[] } = {
      path: this.firstParameter.realFilePath
    }

    if (this.options.sourcePath) {
      query.source = path.resolve(this.rootPath, this.options.sourcePath)
      query.line = this.options.sourceLine.toString()
    }

    return {
      command: [
        'atom',
        '--uri-handler',
        url.format({
          protocol: 'atom',
          hostname: 'pdf-view',
          slashes: true,
          query
        })
      ],
      cd: '$ROOTDIR',
      severity: 'warning',
      spawn: true
    }
  }
}
