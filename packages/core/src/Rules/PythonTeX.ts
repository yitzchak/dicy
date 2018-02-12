import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class PythonTeX extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['PythonTeX']]
  }]

  constructCommand (): CommandOptions {
    // PythonTeX doesn't seem to have any logs, so try to guess at the outputs.
    return {
      command: ['pythontex', '{{$NAME_0}}'],
      cd: '$ROOTDIR_0',
      severity: 'error',
      globbedOutputs: [{ file: '$DIR_0/pythontex-files-$NAME_0/*' }]
    }
  }
}
