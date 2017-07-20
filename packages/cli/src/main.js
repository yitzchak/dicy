#! /usr/bin/env node
/* @flow */

import 'babel-polyfill'
import _ from 'lodash'
import chalk from 'chalk'
import cliui from 'cliui'
import path from 'path'
import program from 'commander'
import yaml from 'js-yaml'

import { DiCy, File } from '@dicy/core'

// $FlowIgnore
const columns = Math.max(process.stdout.columns, 80)

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
  const {
    saveEvents = [],
    verbose = false,
    consoleEventOutput = false,
    ...options
  } = cloneOptions(env.opts())
  const eventData = {}
  commands.unshift('load')
  commands.push('save')

  function log (message) {
    if (consoleEventOutput) return

    const ui = cliui()
    const severityColumnWidth = 10

    function printReference (reference, label) {
      if (!reference) return
      const start = reference.range && reference.range.start
        ? ` @ ${reference.range.start}`
        : ''
      const end = reference.range && reference.range.end
        ? `-${reference.range.end}`
        : ''
      return printRow('', chalk.dim(`[${label}] ${reference.file}${start}${end}`))
    }

    function printRow (severity, text) {
      ui.div({
        text: severity || '',
        width: severityColumnWidth
      }, {
        text,
        width: columns - severityColumnWidth
      })
    }

    let severity

    switch (message.severity) {
      case 'error':
        severity = chalk.red('(ERROR)')
        break
      case 'warning':
        severity = chalk.yellow('(WARNING)')
        break
      default:
        severity = chalk.blue('(INFO)')
        break
    }

    let text = message.text

    if (message.name || message.category) {
      text = `[${message.name}${message.category ? '/' : ''}${message.category || ''}] ${message.text}`
    }

    text.split('\n').forEach((line, index) => printRow(index === 0 ? severity : '', index === 0 ? line : `- ${line}`))

    printReference(message.source, 'Source')
    printReference(message.log, 'Log')

    console.log(ui.toString())
  }

  let success = true

  for (const filePath of inputs) {
    const events = []
    const dicy = await DiCy.create(path.resolve(filePath), options)
    dicy
      .on('log', log)
      .on('action', event => {
        if (verbose) {
          const triggerText = event.triggers.length !== 0 ? ` triggered by updates to ${event.triggers}` : ''
          log({
            severity: 'info',
            name: event.rule,
            text: `[${event.rule}] Evaluating ${event.action} action${triggerText}`
          })
        }
      })
      .on('command', event => {
        log({
          severity: 'info',
          name: event.rule,
          text: `Executing \`${event.command}\``
        })
      })
      .on('fileDeleted', event => {
        if (!event.virtual) {
          log({
            severity: 'info',
            name: 'DiCy',
            text: `Deleting \`${event.file}\``
          })
        }
      })

    for (const type of saveEvents) {
      dicy.on(type, event => { events.push(event) })
    }

    process.on('SIGTERM', () => dicy.kill())
    process.on('SIGINT', () => dicy.kill())

    success = await dicy.run(...commands) || success

    for (const target of await dicy.getTargetPaths()) {
      log({
        severity: 'info',
        name: 'DiCy',
        text: `Produced \`${target}\``
      })
    }

    if (saveEvents.length !== 0) {
      const data = { types: saveEvents, events }
      if (consoleEventOutput) {
        eventData[filePath] = data
      } else {
        const eventFilePath = dicy.resolvePath('$ROOTDIR/$NAME-events.yaml')
        await File.safeDump(eventFilePath, data)
      }
    }
  }

  if (consoleEventOutput) {
    console.log(yaml.safeDump(eventData))
  }

  process.exit(success ? 0 : 1)
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

    pc = pc.option('--save-events <saveEvents>', 'List of event types to save in YAML format. By default this will save to a file <name>-events.yaml unless --console-event-output is enabled.', parseStrings, [])
    pc = pc.option('-v, --verbose', 'Be verbose in command output.')
    pc = pc.option('--console-event-output', 'Output saved events in YAML format to console. This will supress all other output.')

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
      const ui = cliui({ width: columns })
      const { command } = cloneOptions(env.opts())
      const dicy = await DiCy.create('foo.tex')
      ui.div(dicy.getAvailableRules(command).map(rule => `${rule.name}\t  ${rule.description}`).join('\n'))
      console.log(ui.toString())
    })

  program
    .parse(process.argv)
}, error => { console.log(error) })
