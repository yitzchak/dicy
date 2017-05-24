/* @flow */

import _ from 'lodash'

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class ApplyOptions extends Rule {
  static commands: Set<Command> = new Set(['load'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Apply options from YAML file and any LaTeX magic comments found in source file.'

  async run () {
    const inputs = await this.getResolvedInputs([
      '$HOME/.dicy.yaml-ParsedYAML',
      'dicy.yaml-ParsedYAML',
      '$NAME.yaml-ParsedYAML',
      '$BASE-ParsedLaTeXMagic',
      'dicy-instance.yaml-ParsedYAML'])

    const oldOptions = _.cloneDeep(this.state.options)

    this.state.resetOptions()
    for (const file: File of inputs) {
      if (file.value) {
        this.state.assignOptions(file.value)
      }
    }

    function matcher (objValue, srcValue, key, object, source) {
      if (['ignoreCache', 'phaseCycles', 'severity'].includes(key)) return true
    }

    if (!_.isMatchWith(this.state.options, oldOptions, matcher)) {
      const rules = Array.from(this.rules).filter(rule => rule.command !== 'load' || rule.phase === 'finalize')
      if (rules.length !== 0) {
        this.warning('Options have changed. Resetting all rules.')
        for (const rule of rules) {
          this.state.removeRule(rule)
        }
      }
    }

    return true
  }
}
