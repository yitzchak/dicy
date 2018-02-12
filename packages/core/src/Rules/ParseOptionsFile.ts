import Rule from '../Rule'
import { Action, RuleDescription } from '../types'

export default class ParseOptionsFile extends Rule {
  static descriptions: RuleDescription[] = [{
    commands: ['load'],
    phases: ['execute']
  }]
  static defaultActions: Action[] = ['parse']

  async preEvaluate () {
    await this.getResolvedInputs(['$CONFIG_HOME/dicy/config.yaml', 'dicy.yaml', '$NAME.yaml'])
    if (this.inputs.length === 0) this.actions.delete('run')
  }

  async parse () {
    for (const input of this.inputs) {
      const output = await this.getOutput(`${input.filePath}-ParsedYAML`)
      if (output) {
        output.value = await input.readYaml()
      }
    }

    return true
  }
}
