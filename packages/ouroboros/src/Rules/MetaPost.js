/* @flow */

import Rule from '../Rule'

export default class MetaPost extends Rule {
  static fileTypes: Set<string> = new Set(['MetaPost'])
  static description: string = 'Runs MetaPost on produced MetaPost files.'

  constructCommand () {
    return [
      'mpost',
      this.resolvePath('$BASE', this.firstParameter.filePath)
    ]
  }

  constructProcessOptions (): Object {
    return {
      cwd: this.resolvePath('$ROOTDIR/$DIR', this.firstParameter)
    }
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getGlobbedOutputs('$DIR/$NAME.+([0-9])', this.firstParameter)
    await this.getResolvedOutputs(['$DIR/$NAME.log', '$DIR/$NAME.t1'], this.firstParameter)
    return true
  }
}
