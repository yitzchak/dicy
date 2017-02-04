#! /usr/bin/env node
/* @flow */

import 'babel-polyfill'
import _ from 'lodash'
import chalk from 'chalk'
import path from 'path'
import program from 'commander'
import fs from 'fs-promise'
import yaml from 'js-yaml'

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
  const { saveEvents, ...options } = cloneOptions(env.opts())

  for (const filePath of inputs) {
    const messages = []
    const builder = await Builder.create(path.resolve(filePath), options)
    builder.buildState.on('message', message => {
      if (saveEvents) messages.push(message)
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
    await builder.run('save')

    if (saveEvents) {
      const eventFilePath = builder.resolvePath('-events.yaml', {
        absolute: true,
        useJobName: false,
        useOutputDirectory: false
      })
      const events = { messages }

      const serialized = yaml.safeDump(events, { skipInvalid: true })
      await fs.writeFile(eventFilePath, serialized)
    }
  }
}

program
  .version('0.0.0')
  .description('An experimental circular builder for LaTeX')

Builder.getOptionDefinitions().then(definitions => {
  function loadOptions (pc) {
    for (const name in definitions) {
      const option = definitions[name]

      if (!option.commands.includes(pc.name())) continue

      const prefix = (option.type === 'boolean' && option.defaultValue) ? 'no-' : ''
      const flagList = [].concat(option.aliases || [], name)
        .map(name => name.length === 1 ? `-${name}` : `--${prefix}${_.kebabCase(name)}`)
        .join(', ')
      const flags = (option.type === 'boolean') ? flagList : `${flagList} <${name}>`

      switch (option.type) {
        case 'string':
          if (option.values) {
            pc = pc.option(flags, option.description, new RegExp(`^(${option.values.join('|')})$`), option.defaultValue)
          } else {
            pc = pc.option(flags, option.description, option.defaultValue)
          }
          break
        case 'strings':
          pc = pc.option(flags, option.description, parseArray, option.defaultValue)
          break
        case 'boolean':
          pc = pc.option(flags, option.description)
          break
      }
    }

    pc = pc.option('--save-events', 'Save received events for test usage.')

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
