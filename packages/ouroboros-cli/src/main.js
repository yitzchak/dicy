#! /usr/bin/env node
/* @flow */

import 'babel-polyfill'
import _ from 'lodash'
import chalk from 'chalk'
import path from 'path'
import program from 'commander'
import cliui from 'cliui'

import { Ouroboros, File } from 'ouroboros'

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
  const commands = env.name().split(',')
  const { saveEvents = [], verbose = false, ...options } = cloneOptions(env.opts())
  commands.unshift('load')
  commands.push('save')

  for (const filePath of inputs) {
    const events = []
    const ouroboros = await Ouroboros.create(path.resolve(filePath), options)
    ouroboros
      .on('log', event => {
        const nameText = event.name ? `[${event.name}] ` : ''
        const typeText = event.category ? `${event.category}: ` : ''
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
      ouroboros.on(type, event => { events.push(event) })
    }

    await ouroboros.run(...commands)

    if (saveEvents.length !== 0) {
      const eventFilePath = ouroboros.resolvePath('$dir/$name-events.yaml')
      await File.safeDump(eventFilePath, { types: saveEvents, events })
    }
  }
}

program
  .version('0.0.0')
  .description('An experimental circular builder for LaTeX')

Ouroboros.getOptionDefinitions().then(definitions => {
  function loadOptions (pc) {
    for (const name in definitions) {
      const option = definitions[name]
      if (option.status === 'legacy') continue
      const commands = pc.name().split(',')

      if (!option.commands.some(command => commands.includes(command))) continue

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
    .description('Build the inputs.'))
    .action(command)

  loadOptions(program
    .command('clean [inputs...]')
    .alias('c')
    .description('Clean up after a previous build.'))
    .action(command)

  loadOptions(program
    .command('log [inputs...]')
    .alias('l')
    .description('Report messages from any logs.'))
    .action(command)

  loadOptions(program
    .command('graph [inputs...]')
    .alias('g')
    .description('Create a dependency graph from a previous build.'))
    .action(command)

  loadOptions(program
    .command('build,clean [inputs...]')
    .alias('bc')
    .description('Build the inputs and then clean up.'))
    .action(command)

  loadOptions(program
    .command('build,log [inputs...]')
    .alias('bl')
    .description('Build the inputs and report messages from any logs.'))
    .action(command)

  loadOptions(program
    .command('build,log,clean [inputs...]')
    .alias('blc')
    .description('Build the inputs, report messages from any logs, and then clean up.'))
    .action(command)

  program
    .command('rules')
    .description('List available rules')
    .option('--command <command>', 'List only rules that apply to a specific command.', null)
    .action(async (env) => {
      const { command } = cloneOptions(env.opts())
      const ouroboros = await Ouroboros.create('foo.tex')
      ui.div(ouroboros.getAvailableRules(command).map(rule => `${rule.name}\t  ${rule.description}`).join('\n'))
      console.log(ui.toString())
    })

  program
    .parse(process.argv)
}, error => { console.log(error) })
