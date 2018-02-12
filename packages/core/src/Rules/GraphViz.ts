import Rule from '../Rule'
import { CommandOptions, RuleDescription } from '../types'

export default class GraphViz extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['graph'],
    phases: ['execute'],
    parameters: [['GraphViz']]
  }]

  constructCommand (): CommandOptions {
    // Right now we only call fdp. Long usefulness of this is unknown.
    return {
      command: [
        'fdp',
        `-T${this.options.outputFormat}`,
        '-o',
        '{{$DIR_0/$NAME_0$OUTEXT}}',
        '{{$FILEPATH_0}}'
      ],
      cd: '$ROOTDIR',
      severity: 'error',
      outputs: [{ file: '$DIR_0/$NAME_0.$OUTEXT' }]
    }
  }
}
