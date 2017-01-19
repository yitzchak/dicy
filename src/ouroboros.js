/* @flow */

import 'babel-polyfill'
import chalk from 'chalk'
import path from 'path'
import program from 'commander'

import { Builder } from './main'

function parseArray (val) {
  return val.split(/\s*,\s*/)
}

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
  .option('-i, --ignore-cache', 'ignore the current cache')
  .option('--output-format <format>', 'output format [pdf]', /^(pdf|ps|dvi)$/, 'pdf')
  .option('--output-directory <outputDirectory>', 'output directory')
  .option('--job-name <jobName>', 'job name for job')
  .option('--job-names <jobNames>', 'job names', parseArray)
  .option('--logging-level <loggingLevel>', 'logging level')
  .action(async (inputs, env) => {
    const options = cloneOptions(env.opts())

    for (const filePath of inputs) {
      const builder = await Builder.create(path.resolve(filePath), options, (message) => {
        switch (message.severity) {
          case 'error':
            console.error(chalk.red(message.text))
            break
          case 'warning':
            console.warn(chalk.yellow(message.text))
            break
          default:
            console.info(message.text)
            break
        }
      })
      await builder.build()
    }
  })

program
  .parse(process.argv)
