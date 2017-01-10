/* @flow */

import polyfill from 'babel-polyfill'
import program from 'commander'
import BuildState from './BuildState'
import Builder from './Builder'

program
  .version('0.0.0')

program
  .command('build [inputs...]')
  .option('--output-format=<format>', 'output format [pdf]', /^(pdf|ps|dvi)$/, 'pdf')
  .option('--job-name=<jobName>', 'job name for job')
  .action(async (inputs, env) => {
    const buildState = new BuildState()
    const builder = new Builder(buildState)

    for (const filePath of inputs) {
      buildState.getFile(filePath)
    }

    await builder.initialize()
    await builder.analyze()
    await builder.evaluate()
  })

program
  .parse(process.argv)
