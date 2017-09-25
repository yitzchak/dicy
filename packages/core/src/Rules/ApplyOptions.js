/* @flow */

import _ from 'lodash'

import File from '../File'
import Rule from '../Rule'
import { DEFAULT_OPTIONS } from '../types'

import type { Command, Phase } from '../types'

export default class ApplyOptions extends Rule {
  static commands: Set<Command> = new Set(['load'])
  // ApplyOptions runs in both the initialize and execute phases so that
  // instance options will be seen in the initialize phase.
  static phases: Set<Phase> = new Set(['initialize', 'execute'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Apply options from YAML files and any LaTeX magic comments found in source file.'

  async run (): Promise<boolean> {
    // Save the old options so we can tell if they have changed.
    const previousOptions = _.cloneDeep(this.state.options)

    await this.doAssignOptions()
    this.checkForConfigurationChange(previousOptions)

    return true
  }

  async doAssignOptions (): Promise<void> {
    // All the possible sources of configuration data with low priority first.
    const optionPaths = [
      'dicy.yaml-ParsedYAML',
      '$NAME.yaml-ParsedYAML',
      '$BASE-ParsedLaTeXMagic',
      'dicy-instance.yaml-ParsedYAML'
    ]

    const inputs: Array<File> = await this.getResolvedInputs(optionPaths)
    const optionSet: Array<Object> = inputs.map(file => file.value || {})
    const loadUserOptions: boolean = optionSet.reduce(
      (loadUserOptions, options) => ('loadUserOptions' in options) ? options.loadUserOptions : loadUserOptions,
      DEFAULT_OPTIONS.loadUserOptions)

    // Load the user options if loadUserOptions is true.
    if (loadUserOptions) {
      const userOptions: ?File = await this.getResolvedInput('$HOME/.dicy.yaml-ParsedYAML')
      if (userOptions) {
        optionSet.unshift(userOptions.value || {})
      }
    } else {
      this.info('Ignoring user options since `loadUserOptions` is false.')
    }

    // Reset the options and assign from frrom the inputs
    this.state.resetOptions()

    for (const options: Object of optionSet) {
      this.assignOptions(options)
    }
  }

  checkForConfigurationChange (previousOptions: Object): void {
    // Ignore options that don't actually change the build.
    const matcher = (objValue, srcValue, key, object, source) => {
      const schema = this.state.optionSchema.get(key.toString())
      if (schema && schema.noInvalidate) return true
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
