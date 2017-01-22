#! /usr/bin/env node
/* @flow */

import 'babel-polyfill'
import _ from 'lodash'
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

Builder.getOptionDefinitions().then(definitions => {
  function loadOptions (pc) {
    for (const name in definitions) {
      const option = definitions[name]
      const kebabName = _.kebabCase(name)
      const alias = option.alias ? `-${option.alias}, ` : ''

      switch (option.type) {
        case 'string':
          pc = pc.option(`${alias}--${kebabName} <${name}>`, option.description, option.defaultValue)
          break
        case 'strings':
          pc = pc.option(`${alias}--${kebabName} <${name}>`, option.description, parseArray, option.defaultValue)
          break
        case 'boolean':
          pc = pc.option(`${alias}--${option.defaultValue ? 'no-' : ''}${kebabName}`, option.description)
          break
      }
    }
    return pc
  }

  loadOptions(program
    .command('build [inputs...]')
    .alias('b')
    .description('Build the inputs'))
    .action(command)

  loadOptions(program
    .command('report [inputs...]')
    .alias('r')
    .description('Report the results from a previous build'))
    .action(command)

  program
    .parse(process.argv)
}, error => { console.log(error) })
