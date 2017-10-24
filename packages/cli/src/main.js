#! /usr/bin/env node
/* @flow */

import 'babel-polyfill'
import _ from 'lodash'
import chalk from 'chalk'
import cliui from 'cliui'
import path from 'path'
import yargs from 'yargs'
import yaml from 'js-yaml'

import { DiCy, File } from '@dicy/core'

// $FlowIgnore
const columns = Math.min(Math.max(process.stdout.columns, 80), 132)

const optionNames = {}
const commandLists = {}

const command = async (argv) => {
  const options = {}
  for (const name in argv) {
    const value = argv[name]
    if (name in optionNames && value !== undefined && value !== false) {
      options[optionNames[name]] = name.startsWith('no-') ? !argv[name] : argv[name]
    }
  }
  const commands = commandLists[argv._]
  const {
    saveEvents = [],
    verbose = false,
    consoleEventOutput = false,
    inputs = []
  } = argv
  const eventData = {}

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
        await File.writeYaml(eventFilePath, data)
      }
    }
  }

  if (consoleEventOutput) {
    console.log(yaml.safeDump(eventData))
  }

  process.exit(success ? 0 : 1)
}

yargs
  .wrap(columns)
  .usage('DiCy - A builder for LaTeX, knitr, literate Agda, literate Haskell and Pweave that automatically builds dependencies.')

DiCy.getOptionDefinitions().then(definitions => {
  function getOptions (commands) {
    const options = {
      'save-events': {
        array: true,
        description: 'List of event types to save in YAML format. By default this will save to a file <name>-events.yaml unless --console-event-output is enabled.'
      },
      verbose: {
        alias: 'v',
        boolean: true,
        description: 'Be verbose in command output.'
      },
      'console-event-output': {
        boolean: true,
        description: 'Output saved events in YAML format to console. This will supress all other output.'
      }
    }

    for (const option of definitions) {
      // Skip environment variables
      if (option.name.startsWith('$') || option.name.includes('_')) continue

      if (option.commands && !option.commands.some(command => commands.includes(command))) continue

      let name = _.kebabCase(option.name).replace('lhs-2-tex', 'lhs2tex')
      const o = {
        alias: (option.aliases || []).filter(alias => alias.length === 1),
        description: option.description,
        type: 'string'
      }

      if (option.values) {
        // $FlowIgnore
        o.choices = option.values
      }

      optionNames[name] = option.name

      switch (option.type) {
        case 'strings':
        case 'numbers':
          o.type = 'array'
          options[name] = o
          break
        case 'number':
          o.type = 'number'
          options[name] = o
          break
        case 'boolean':
          // $FlowIgnore
          o.type = 'boolean'
          const shadowOption = {
            type: 'boolean',
            hidden: true
          }
          const negatedName = `no-${name}`
          optionNames[negatedName] = option.name
          if (option.defaultValue) {
            o.description = o.description.replace('Enable', 'Disable')
            options[name] = shadowOption
            options[negatedName] = o
          } else {
            options[name] = o
            options[negatedName] = shadowOption
          }
          break
        default:
          options[name] = o
          break
      }
    }

    return options
  }

  function createCommand (commands, description) {
    const name = commands.join(',')
    const alias = commands.map(c => c.substr(0, 1)).join('')

    commands.unshift('load')
    commands.push('save')

    commandLists[name] = commands
    commandLists[alias] = commands

    yargs
      .command({
        command: `${name} <inputs...>`,
        aliases: [alias],
        description,
        builder: yargs => {
          yargs
            .options(getOptions(commands))
            .epilogue('All boolean options can be negated by adding or removing the `no-` prefix.')
        },
        handler: command
      })
  }

  createCommand(['build'], 'Build the inputs.')
  createCommand(['clean'], 'Clean up after a previous build.')
  createCommand(['scrub'], 'Clean up generated files after a previous build.')
  createCommand(['log'], 'Report messages from any logs.')
  createCommand(['graph'], 'Create a dependency graph from a previous build.')
  createCommand(['build', 'clean'], 'Build the inputs and then clean up.')
  createCommand(['build', 'log'], 'Build the inputs and report messages from any logs.')
  createCommand(['build', 'log', 'clean'], 'Build the inputs, report messages from any logs, and then clean up.')

  yargs.parse()
}, error => { console.log(error) })
