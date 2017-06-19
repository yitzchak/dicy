/* @flow */

import path from 'path'

import Rule from '../Rule'

export default class Sage extends Rule {
  static fileTypes: Array<Set<string>> = [new Set(['Sage'])]
  static description: string = 'Supports SageTeX by running Sage when needed.'

  constructCommand () {
    return {
      args: ['sage', path.basename(this.firstParameter.filePath)],
      severity: 'error'
    }
  }

  constructProcessOptions (): Object {
    return Object.assign(super.constructProcessOptions(), {
      cwd: this.resolvePath('$ROOTDIR/$OUTDIR')
    })
  }

  async processOutput (stdout: string, stderr: string): Promise<boolean> {
    await this.getResolvedOutputs(['$DIR/$NAME.sout', '$DIR/$NAME.sage.cmd', '$DIR/$NAME.scmd', '$DIR/$BASE.py'], this.firstParameter)
    await this.getGlobbedOutputs('$DIR/sage-plots-for-$JOB.tex/*', this.firstParameter)
    return true
  }
}
