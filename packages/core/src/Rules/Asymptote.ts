import File from '../File'
import Rule from '../Rule'
import { Action, CommandOptions, RuleDescription } from '../types'

export default class Asymptote extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['Asymptote']]
  }]

  getActions (file?: File): Action[] {
    // ParsedAsymptoteLog triggers update, all others trigger run.
    return file
      ? [file.type === 'ParsedAsymptoteStdOut' ? 'update' : 'run']
      : []
  }

  constructCommand (): CommandOptions {
    // We are executing in the same directory as the source file so we only need
    // the base name. Also, execute with high verbosity so we can capture a log
    // file from the output.
    /* eslint no-template-curly-in-string: 0 */
    return {
      command: ['asy', '-vv', '{{$BASE_0}}'],
      cd: '$ROOTDIR_0',
      severity: 'error',
      inputs: [{ file: '$DIR_0/$NAME_0.log-ParsedAsymptoteStdOut' }],
      outputs: [
        { file: '$DIR_0/${NAME_0}_0.pdf' },
        { file: '$DIR_0/${NAME_0}_0.eps' },
        { file: '$DIR_0/$NAME_0.pre' }
      ],
      stdout: '$DIR_0/$NAME_0.log-AsymptoteStdOut',
      stderr: '$DIR_0/$NAME_0.log-AsymptoteStdErr'
    }
  }
}
