#! /usr/bin/env node
/* @flow */

import 'babel-polyfill'
import _ from 'lodash'
import chalk from 'chalk'
import path from 'path'
import program from 'commander'
import fs from 'fs-promise'
import cliui from 'cliui'
import yaml from 'js-yaml'

import { Builder } from './main'

const ui = cliui({ width: 80 })

function parseStrings (value) {
  return value.split(/\s*,\s*/)
}

function parseNumber (value) {
  return parseInt(value, 10)
}

function parseNumbers (value) {
  return parseStrings(value).map(x => parseNumber(x))
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
    const events = []
    const builder = await Builder.create(path.resolve(filePath), options)
    builder
      .on('log', event => {
        const nameText = event.name ? `[${event.name}] ` : ''
        const typeText = event.type ? `${event.type}: ` : ''
        const text = `${nameText}${typeText}${event.text.replace('\n', ' ')}`
        switch (event.severity) {
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
      .on('action', event => {
        if (verbose) {
          const triggerText = event.triggers.length !== 0 ? ` triggered by updates to ${event.triggers}` : ''
          console.log(`[${event.rule}] Evaluating ${event.action} action${triggerText}`)
        }
      })
      .on('command', event => {
        console.log(`[${event.rule}] Executing \`${event.command}\``)
      })
      .on('fileDeleted', event => {
        console.log(`Deleting \`${event.file}\``)
      })

    for (const type of saveEvents) {
      builder.on(type, event => { events.push(event) })
    }

    await builder.run('load', env.name(), 'save')

    if (saveEvents.length !== 0) {
      const eventFilePath = builder.resolvePath(':dir/:name-events.yaml')
      const serialized = yaml.safeDump({ types: saveEvents, events }, { skipInvalid: true })
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
          pc = pc.option(flags, option.description, parseStrings, option.defaultValue)
          break
        case 'number':
          pc = pc.option(flags, option.description, parseNumber, option.defaultValue)
          break
        case 'numbers':
          pc = pc.option(flags, option.description, parseNumbers, option.defaultValue)
          break
        case 'boolean':
          pc = pc.option(flags, option.description)
          break
      }
    }

    pc = pc.option('--save-events <saveEvents>', 'List of event types to save for test usage.', parseStrings, [])
    pc = pc.option('-v, --verbose', 'Be verbose in command output.')

    return pc
  }

  loadOptions(program
    .command('build [inputs...]')
    .alias('b')
    .description('Build the inputs'))
    .action(command)

  loadOptions(program
    .command('clean [inputs...]')
    .alias('c')
    .description('Clean up after a previous build'))
    .action(command)

  loadOptions(program
    .command('report [inputs...]')
    .alias('r')
    .description('Report the results from a previous build'))
    .action(command)

  loadOptions(program
    .command('graph [inputs...]')
    .alias('g')
    .description('Create a dependency graph from a previous build'))
    .action(command)

  program
    .command('rules')
    .description('List available rules')
    .option('--command <command>', 'List only rules that apply to a specific command.', null)
    .action(async (env) => {
      const { command } = cloneOptions(env.opts())
      const builder = await Builder.create('foo.tex')
      ui.div(builder.getAvailableRules(command).map(rule => `${rule.name}\t  ${rule.description}`).join('\n'))
      console.log(ui.toString())
    })

  program
    .parse(process.argv)
}, error => { console.log(error) })
