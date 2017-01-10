/* @flow */

import BuildState from './BuildState'
import File from './File'

export default class RuleFactory {
  buildState: BuildState

  constructor (buildState: BuildState) {
    this.buildState = buildState
  }

  async analyze (files: Array<File>) {}
}
