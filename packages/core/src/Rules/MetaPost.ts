import File from '../File'
import Rule from '../Rule'
import { Action, CommandOptions, RuleDescription } from '../types'

export default class MetaPost extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['build'],
    phases: ['execute'],
    parameters: [['MetaPost']]
  }]

  async getFileActions (file: File): Promise<Action[]> {
    // ParsedFileListing triggers update, all others trigger run.
    return [file.type === 'ParsedFileListing' ? 'update' : 'run']
  }

  constructCommand (): CommandOptions {
    // Force the same error options as LaTeX and capture the file listing.
    return {
      command: [
        'mpost',
        '-file-line-error',
        '-interaction=batchmode',
        '-recorder',
        '{{$BASE_0}}'
      ],
      cd: '$ROOTDIR_0',
      severity: 'error',
      inputs: [{ file: '$DIR_0/$NAME_0.fls-ParsedFileListing' }],
      outputs: [
        { file: '$DIR_0/$NAME_0.fls' },
        { file: '$DIR_0/$NAME_0.log' }
      ]
    }
  }
}
