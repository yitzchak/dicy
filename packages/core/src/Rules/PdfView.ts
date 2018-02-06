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
  static parameterTypes: Set<string>[] = [
    new Set([
      'DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript',
      'ScalableVectorGraphics'
    ]),
    new Set(['ParsedAtomEnabledPackages'])
  ]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using Atom\'s pdf-view.'

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return consumer.isOutputTarget(parameters[0]) && parameters[1].value &&
      parameters[1].value['pdf-view']
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
