/* @flow */

import 'babel-polyfill'
import path from 'path'
import program from 'commander'
import BuildState from './BuildState'
import Builder from './Builder'

program
  .version('0.0.0')

program
  .command('build [inputs...]')
  .option('--output-format <format>', 'output format [pdf]', /^(pdf|ps|dvi)$/, 'pdf')
  .option('--output-directory <outputDirectory>', 'output directory')
  .option('--job-name <jobName>', 'job name for job')
  .action(async (inputs, env) => {
    const buildState = new BuildState()
    const builder = new Builder(buildState)

    for (const filePath of inputs) {
      await buildState.getFile(path.resolve(filePath))
    }

    buildState.setOptions(env)

    await builder.initialize()
    await builder.build()
  })

program
  .parse(process.argv)
