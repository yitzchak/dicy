import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class Sage extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['Sage']]
  }]

  constructCommand (): CommandOptions {
    // Sage doesn't seem to have any logs, so try to guess at the outputs.
    return {
      command: ['sage', '{{$BASE_0}}'],
      cd: '$ROOTDIR_0',
      severity: 'error',
      outputs: [
        { file: '$DIR_0/$NAME_0.sout' },
        { file: '$DIR_0/$NAME_0.sage.cmd' },
        { file: '$DIR_0/$NAME_0.scmd' },
        { file: '$FILEPATH_0.py' }
      ],
      globbedInputs: [{ file: '$DIR_0/sage-plots-for-$JOB.tex/*' }]
    }
  }
}
