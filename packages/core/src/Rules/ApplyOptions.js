/* @flow */

import _ from 'lodash'

import File from '../File'
import Rule from '../Rule'

import type { Command, Phase } from '../types'

export default class ApplyOptions extends Rule {
  static commands: Set<Command> = new Set(['load'])
  // ApplyOptions runs in both the initialize and execute phases so that
  // instance options will be seen in the initialize phase.
  static phases: Set<Phase> = new Set(['initialize', 'execute'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Apply options from YAML file and any LaTeX magic comments found in source file.'

  async run () {
    // Save the old options so we can tell if they have changed.
    const previousOptions = _.cloneDeep(this.state.options)

    await this.assignOptions()
    this.checkForConfigurationChange(previousOptions)

    return true
  }

  async assignOptions (): Promise<void> {
    // All the possible sources of configuration data with low priority first.
    const inputs: Array<File> = await this.getResolvedInputs([
      '$HOME/.dicy.yaml-ParsedYAML',
      'dicy.yaml-ParsedYAML',
      '$NAME.yaml-ParsedYAML',
      '$BASE-ParsedLaTeXMagic',
      'dicy-instance.yaml-ParsedYAML'])

    // Reset the options and assign from frrom the inputs
    this.state.resetOptions()

    for (const file: File of inputs) {
      if (file.value) {
        this.state.assignOptions(file.value)
      }
    }
  }

  checkForConfigurationChange (previousOptions: Object): void {
    // Ignore options that don't actually change the build.
    function matcher (objValue, srcValue, key, object, source) {
      if (['ignoreCache', 'phaseCycles', 'severity'].includes(key)) return true
    }

    if (!_.isMatchWith(this.state.options, previousOptions, matcher)) {
      const rules: Array<Rule> = Array.from(this.rules)
        .filter(rule => rule.command !== 'load' || rule.phase === 'finalize')

      if (rules.length !== 0) {
        // Something has changed so remove rules that are not load rules or are
        // in the finalize phase.
        this.warning('Options have changed. Resetting all rules.')
        for (const rule of rules) {
          this.state.removeRule(rule)
        }
      }
    }
  }
}
