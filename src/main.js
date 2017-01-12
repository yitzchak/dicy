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
    for (const filePath of inputs) {
      const builder = await Builder.create(path.resolve(filePath), env)
      await builder.build()
    }
  })

program
  .parse(process.argv)
