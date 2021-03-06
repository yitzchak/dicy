import Rule from '../Rule'
import { CommandOptions } from '../types'

export default class PythonTeX extends Rule {
  static parameterTypes: Set<string>[] = [new Set(['PythonTeX'])]
  static description: string = 'Supports the PythonTeX package by running pythontex when needed.'

  constructCommand (): CommandOptions {
    // PythonTeX doesn't seem to have any logs, so try to guess at the outputs.
    return {
      args: ['pythontex', '{{$NAME_0}}'],
      cd: '$ROOTDIR_0',
      severity: 'error',
      globbedOutputs: [{ file: '$DIR_0/pythontex-files-$NAME_0/*' }]
    }
  }
}
