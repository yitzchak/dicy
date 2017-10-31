#! /usr/bin/env node

import * as _ from 'lodash'
import chalk from 'chalk'
import * as cliui from 'cliui'
import * as path from 'path'
import * as yargs from 'yargs'
import * as yaml from 'js-yaml'

import {
  Command,
  DiCy,
  Event,
  File,
  Message,
  Reference
} from '@dicy/core'

const columns = Math.min(Math.max(process.stdout.columns || 80, 80), 132)

const optionNames: {[name: string]: string} = {}
const commandLists: any = {}

const handler = async (argv: any) => {
  const options: {[name: string]: any} = {}
  for (const name in argv) {
    const value = argv[name]
    if (name in optionNames && value !== undefined && value !== false) {
      options[optionNames[name]] = name.startsWith('no-') ? !argv[name] : argv[name]
    }
  }
  const commands = commandLists[argv._]
  const inputs: string[] = argv.inputs || []
  const saveEvents: string[] = argv.saveEvents || []
  const verbose: boolean = !!argv.verbose
  const consoleEventOutput: boolean = !!argv.consoleEventOutput
  const eventData: any = {}

  function log (message: Message) {
    if (consoleEventOutput) return

    const ui = cliui()
    const severityColumnWidth = 10

    function printReference (reference: Reference | undefined, label: string) {
      if (!reference) return
      const start = reference.range && reference.range.start
        ? ` @ ${reference.range.start}`
        : ''
      const end = reference.range && reference.range.end
        ? `-${reference.range.end}`
        : ''
      return printRow('', chalk.dim(`[${label}] ${reference.file}${start}${end}`))
    }

    function printRow (severity: string, text: string) {
      ui.div({
        text: severity || '',
        width: severityColumnWidth
      }, {
        text,
        width: columns - severityColumnWidth
      })
    }

    let severity: string

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

    text.split('\n').forEach((line: string, index: number) => printRow(index === 0 ? severity : '', index === 0 ? line : `- ${line}`))

    printReference(message.source, 'Source')
    printReference(message.log, 'Log')

    console.log(ui.toString())
  }

  let success = true

  for (const filePath of inputs) {
    const events: Event[] = []
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
  .demandCommand(1, 'You need to specify a command.')
  .help()

DiCy.getOptionDefinitions().then(definitions => {
  function getOptions (commands: Command[]) {
    const options: { [name: string]: any } = {
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

    for (const definition of definitions) {
      // Skip environment variables
      if (definition.name.startsWith('$') || definition.name.includes('_')) continue

      if (definition.commands && !definition.commands.some(command => commands.includes(command as Command))) continue

      const addOption = (name: string, option: any) => {
        optionNames[name] = definition.name
        if (definition.values) {
          // $FlowIgnore
          option.choices = definition.values
        }
        options[name] = option
      }
      const name = _.kebabCase(definition.name).replace('lhs-2-tex', 'lhs2tex')
      const negatedName = `no-${name}`
      const description = definition.description
      const alias = (definition.aliases || []).filter(alias => alias.length === 1)

      switch (definition.type) {
        case 'strings':
          addOption(name, {
            type: 'array',
            alias,
            description
          })
          break
        case 'number':
          addOption(name, {
            type: 'number',
            alias,
            description
          })
          break
        case 'boolean':
          if (definition.defaultValue) {
            addOption(name, {
              type: 'boolean',
              hidden: true
            })
            addOption(negatedName, {
              type: 'boolean',
              alias,
              description: description.replace('Enable', 'Disable')
            })
          } else {
            addOption(negatedName, {
              type: 'boolean',
              hidden: true
            })
            addOption(name, {
              type: 'boolean',
              alias,
              description
            })
          }
          break
        case 'string':
          addOption(name, {
            type: 'string',
            alias,
            description
          })
          break
      }
    }

    return options
  }

  function createCommand (commands: Command[], description: string) {
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
        describe: description,
        builder: yargs => {
          return yargs
            .options(getOptions(commands))
            .epilogue('All boolean options can be negated by adding or removing the `no-` prefix.')
        },
        handler
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

  /* tslint:disable:no-unused-expression */
  yargs.argv
}, error => { console.log(error) })
