import * as _ from 'lodash'

import File from '../File'
import Rule from '../Rule'
import { DEFAULT_OPTIONS, Command, Phase } from '../types'

export default class ApplyOptions extends Rule {
  static commands: Set<Command> = new Set<Command>(['load'])
  // ApplyOptions runs in both the initialize and execute phases so that
  // instance options will be seen in the initialize phase.
  static phases: Set<Phase> = new Set<Phase>(['initialize', 'execute'])
  static alwaysEvaluate: boolean = true
  static ignoreJobName: boolean = true
  static description: string = 'Apply options from YAML files and any LaTeX magic comments found in source file.'

  async run (): Promise<boolean> {
    // Save the old options so we can tell if they have changed.
    const previousOptions = this.serializedOptions
    console.log(`sdfsdf ${previousOptions}`)

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

    const inputs: File[] = await this.getResolvedInputs(optionPaths)
    const optionSet: any[] = inputs.map(file => file.value || {})
    const loadUserOptions: boolean = optionSet.reduce(
      (loadUserOptions, options) => ('loadUserOptions' in options) ? options.loadUserOptions : loadUserOptions,
      DEFAULT_OPTIONS.loadUserOptions)

    // Load the user options if loadUserOptions is true.
    if (loadUserOptions) {
      const userOptions: File | undefined = await this.getResolvedInput('$HOME/.dicy.yaml-ParsedYAML')
      if (userOptions) {
        optionSet.unshift(userOptions.value || {})
      }
    } else {
      this.info('Ignoring user options since `loadUserOptions` is false.')
    }

    // Reset the options and assign from from the inputs
    this.resetOptions()

    for (const options of optionSet) {
      this.assignOptions(options)
    }
  }

  checkForConfigurationChange (previousOptions: object): void {
    // Ignore options that don't actually change the build.
    type foo = (value: any, other: any, key?: string | number | symbol) => boolean
    const matcher = (value: any, other: any, key?: string | number | symbol): boolean | undefined => {
      if (key) {
        const schema = this.getOptionSchema(key.toString())
        if (!schema) console.log(key)
        if (schema && schema.noInvalidate) return true
      }

      return undefined
    }

    if (!_.isMatchWith(this.serializedOptions, previousOptions, matcher as foo)) {
      const rules: Rule[] = Array.from(this.rules)
        .filter(rule => rule.command !== 'load' || rule.phase === 'finalize')

      if (rules.length !== 0) {
        // Something has changed so remove rules that are not load rules or are
        // in the finalize phase.
        this.warning('Options have changed. Resetting all rules.')
        for (const rule of rules) {
          this.removeRule(rule)
        }
      }
    }
  }
}
