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
  const { saveEvents = [], verbose = false, ...options } = cloneOptions(env.opts())

  for (const filePath of inputs) {
    const events = _.fromPairs(saveEvents.map(type => [type, []]))
    const builder = await Builder.create(path.resolve(filePath), options)
    builder
      .on('log', message => {
        if (saveEvents.includes('log')) events.log.push(message)
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
      .on('action', ({ action, id, triggers }) => {
        if (saveEvents.includes('action')) events.action.push({ action, id, triggers })
        if (verbose) {
          const triggerText = triggers.length !== 0 ? ` triggered by updates to ${triggers}` : ''
          console.log(`[${id}] Evaluating ${action} action${triggerText}`)
        }
      })
      .on('command', ({ id, command }) => {
        if (saveEvents.includes('command')) events.command.push({ id, command })
        console.log(`[${id}] Executing \`${command}\``)
      })
      .on('file', event => {
        if (saveEvents.includes('file')) events.file.push(event)
      })
    await builder.run(env.name())
    await builder.run('save')

    if (saveEvents) {
      const eventFilePath = builder.resolvePath('-events.yaml', {
        absolute: true,
        useJobName: false,
        useOutputDirectory: false
      })
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

    pc = pc.option('--save-events <saveEvents>', 'List of event types to save for test usage.', parseArray, [])
    pc = pc.option('-v, --verbose', 'Be verbose in command output.')

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
