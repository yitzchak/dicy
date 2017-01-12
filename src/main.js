/* @flow */

import 'babel-polyfill'
import path from 'path'
import program from 'commander'
import Builder from './Builder'

function cloneOptions (options) {
  const newOptions = {}

  for (const property in options) {
    const value = options[property]
    if (value !== undefined) {
      newOptions[property] = value
    }
  }

  return newOptions
}

program
  .version('0.0.0')

program
  .command('build [inputs...]')
  .option('--output-format <format>', 'output format [pdf]', /^(pdf|ps|dvi)$/, 'pdf')
  .option('--output-directory <outputDirectory>', 'output directory')
  .option('--job-name <jobName>', 'job name for job')
  .action(async (inputs, env) => {
    const options = cloneOptions(env.opts())

    for (const filePath of inputs) {
      const builder = await Builder.create(path.resolve(filePath), options)
      await builder.build()
      await builder.saveState()
    }
  })

program
  .parse(process.argv)
