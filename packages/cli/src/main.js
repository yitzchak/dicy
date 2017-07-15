#! /usr/bin/env node
/* @flow */

import 'babel-polyfill'
import _ from 'lodash'
import chalk from 'chalk'
import path from 'path'
import program from 'commander'
import cliui from 'cliui'

import { DiCy, File } from '@dicy/core'

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
    const dicy = await DiCy.create(path.resolve(filePath), options)
    dicy
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
        if (!event.virtual) console.log(`Deleting \`${event.file}\``)
      })

    for (const type of saveEvents) {
      dicy.on(type, event => { events.push(event) })
    }

    process.on('SIGTERM', () => dicy.kill())
    process.on('SIGINT', () => dicy.kill())

    await dicy.run(...commands)

    for (const target of await dicy.getTargetPaths()) {
      console.log(`Produced \`${target}\``)
    }

    if (saveEvents.length !== 0) {
      const eventFilePath = dicy.resolvePath('$DIR/$NAME-events.yaml')
      await File.safeDump(eventFilePath, { types: saveEvents, events })
    }
  }
}

program
  .version(require('../package.json').version)
  .description('An experimental circular builder for LaTeX')

DiCy.getOptionDefinitions().then(definitions => {
  function loadOptions (pc) {
    for (const option of definitions) {
      // Skip environment variables
      if (option.name.startsWith('$') || option.name.includes('_')) continue

      const commands = pc.name().split(',')

      if (!option.commands.some(command => commands.includes(command))) continue

      const prefix = (option.type === 'boolean' && option.defaultValue) ? 'no-' : ''
      const flagList = [].concat((option.aliases || []).filter(alias => alias.length === 1), option.name)
        .map(name => name.length === 1 ? `-${name}` : `--${prefix}${_.kebabCase(name)}`)
        .join(', ')
      const flags = (option.type === 'boolean') ? flagList : `${flagList} <${option.name}>`
      let description = option.description

      if ((option.type === 'string' || option.type === 'number') && (option.values || option.defaultValue)) {
        const parts = []
        if (option.values) parts.push(`values=${option.values.join('|')}`)
        if (option.defaultValue) parts.push(`default value=${option.defaultValue}`)
        description += ` (${parts.join('; ')})`
      }

      switch (option.type) {
        case 'string':
          if (option.values) {
            pc = pc.option(flags, description, new RegExp(`^(${option.values.join('|')})$`))
          } else {
            pc = pc.option(flags, description)
          }
          break
        case 'strings':
          pc = pc.option(flags, description, parseStrings)
          break
        case 'number':
          pc = pc.option(flags, description, parseNumber)
          break
        case 'numbers':
          pc = pc.option(flags, description, parseNumbers)
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
    .command('scrub [inputs...]')
    .alias('s')
    .description('Clean up generated files after a previous build.'))
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
      const dicy = await DiCy.create('foo.tex')
      ui.div(dicy.getAvailableRules(command).map(rule => `${rule.name}\t  ${rule.description}`).join('\n'))
      console.log(ui.toString())
    })

  program
    .parse(process.argv)
}, error => { console.log(error) })
