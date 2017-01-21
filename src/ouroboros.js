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

const command = async (inputs, env) => {
  const options = cloneOptions(env.opts())

  for (const filePath of inputs) {
    const builder = await Builder.create(path.resolve(filePath), options, (message) => {
      const nameText = message.name ? `[${message.name}] ` : ''
      const typeText = message.type ? `${message.type}: ` : ''
      const text = `${nameText}${typeText}${message.text.replace('\n', ' ')}`
      switch (message.severity) {
        case 'error':
          console.error(chalk.red(text))
          break
        case 'warning':
          console.warn(chalk.yellow(text))
          break
        case 'trace':
          console.warn(chalk.blue(text))
          break
        default:
          console.info(text)
          break
      }
    })
    await builder.run(env.name())
  }
}

program
  .version('0.0.0')

program
  .command('build [inputs...]')
  .alias('b')
  .description('Build the inputs')
  .option('-i, --ignore-cache', 'ignore the current cache')
  .option('--output-format <format>', 'output format [pdf]', /^(pdf|ps|dvi)$/, 'pdf')
  .option('--output-directory <outputDirectory>', 'output directory')
  .option('--job-name <jobName>', 'job name for job')
  .option('--job-names <jobNames>', 'job names', parseArray)
  .option('--logging-level <loggingLevel>', 'logging level')
  .action(command)

program
  .command('report [inputs...]')
  .alias('r')
  .description('Report the results from a previous build')
  .option('--logging-level <loggingLevel>', 'logging level')
  .action(command)

program
  .parse(process.argv)
