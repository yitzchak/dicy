import * as _ from 'lodash'
import * as cliui from 'cliui'
import * as fs from 'fs-extra'
const fileUrl = require('file-url')
import * as path from 'path'
import * as yaml from 'js-yaml'
import chalk from 'chalk'
const url2path = require('file-uri-to-path')
const yargs = require('yargs/yargs')

import {
  getOptionDefinitions,
  Command,
  DiCy,
  Message,
  OptionDefinition,
  Reference,
  Uri
} from '@dicy/core'

export default class Program {
  dicy = new DiCy()
  yargs = yargs(process.argv.slice(2))
  columns: number = Math.min(Math.max(process.stdout.columns || 80, 80), 132)
  optionNames: {[name: string]: string} = {}
  commandLists: any = {}
  optionDefinitions: OptionDefinition[] = []
  logs: Map<Uri, Message[]> = new Map<Uri, Message[]>()

  constructor () {
    this.dicy.on('log', (file: Uri, messages: Message[]) => this.log(file, messages))

    this.yargs
      .wrap(this.columns)
      .usage('DiCy - A builder for LaTeX, knitr, literate Agda, literate Haskell and Pweave that automatically builds dependencies.')
      .demandCommand(1, 'You need to specify a command.')
      .recommendCommands()
      .help()

    process.on('SIGTERM', () => this.dicy.killAll())
    process.on('SIGINT', () => this.dicy.killAll())
  }

  getOptions (commands: Command[]) {
    const options: { [name: string]: any } = {
      'save-log': {
        boolean: true,
        description: 'Save the log as a YAML file <name>-log.yaml.'
      }
    }

    for (const definition of this.optionDefinitions) {
      // Skip environment variables
      if (definition.name.startsWith('$') || definition.name.includes('_')) continue

      if (definition.commands && !definition.commands.some(command => commands.includes(command as Command))) continue

      const addOption = (name: string, option: any) => {
        this.optionNames[name] = definition.name
        if (definition.values) {
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

  createCommand (commands: Command[], description: string) {
    const name = commands.join(',')
    const alias = commands.map(c => c.substr(0, 1)).join('')

    commands.unshift('load')
    commands.push('save')

    this.commandLists[name] = commands
    this.commandLists[alias] = commands

    this.yargs
      .command({
        command: `${name} <inputs...>`,
        aliases: [alias],
        describe: description,
        builder: (yargs: any) => {
          return yargs
            .options(this.getOptions(commands))
            .epilogue('All boolean options can be negated by adding or removing the `no-` prefix.')
        },
        handler: (argv: any) => this.handler(argv)
      })
  }

  async start () {
    this.optionDefinitions = await getOptionDefinitions()

    this.createCommand(['build'], 'Build the inputs.')
    this.createCommand(['clean'], 'Clean up after a previous build.')
    this.createCommand(['scrub'], 'Clean up generated files after a previous build.')
    this.createCommand(['log'], 'Report messages from any logs.')
    this.createCommand(['graph'], 'Create a dependency graph from a previous build.')
    this.createCommand(['build', 'clean'], 'Build the inputs and then clean up.')
    this.createCommand(['build', 'log'], 'Build the inputs and report messages from any logs.')
    this.createCommand(['build', 'log', 'clean'], 'Build the inputs, report messages from any logs, and then clean up.')

    /* tslint:disable:no-unused-expression */
    this.yargs.argv
  }

  log (file: Uri, messages: Message[]) {
    const current = this.logs.get(file) || []
    this.logs.set(file, current.concat(messages))

    const ui = cliui()
    const severityColumnWidth = 10

    const printRow = (severity: string, text: string): void => {
      ui.div({
        text: severity || '',
        width: severityColumnWidth
      }, {
        text,
        width: this.columns - severityColumnWidth
      })
    }

    const printReference = (reference: Reference | undefined, label: string): void => {
      if (!reference) return
      const start = reference.range && reference.range.start
        ? ` @ ${reference.range.start}`
        : ''
      const end = reference.range && reference.range.end && reference.range.end !== reference.range.start
        ? `-${reference.range.end}`
        : ''
      return printRow('', chalk.dim(`[${label}] ${reference.file}${start}${end}`))
    }

    for (const message of messages) {
      let severity: string

      switch (message.severity) {
        case 'error':
          severity = chalk.red('(ERROR)')
          break
        case 'warning':
          severity = chalk.yellow('(WARNING)')
          break
        case 'trace':
          severity = '(TRACE)'
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
    }

    console.log(ui.toString())
  }

  async handler (argv: any) {
    const saveLog: boolean = !!argv['save-log']
    const options: {[name: string]: any} = {}
    const commands = this.commandLists[argv._]
    const files: Uri[] = (argv.inputs || []).map(fileUrl)

    this.initializeLogs(files)

    for (const name in argv) {
      const value = argv[name]
      if (name in this.optionNames && value !== undefined && value !== false) {
        options[this.optionNames[name]] = name.startsWith('no-') ? !argv[name] : argv[name]
      }
    }

    await Promise.all(files.map(file => this.dicy.setInstanceOptions(file, options)))

    const success: boolean = (await Promise.all(files.map(file => this.dicy.run(file, commands)))).every(x => x)

    if (saveLog) await this.saveLogs()

    await this.dicy.destroy()

    process.exit(success ? 0 : 1)
  }

  initializeLogs (files: Uri[]) {
    for (const file of files) {
      this.logs.set(file, [])
    }
  }

  async saveLogs () {
    for (const [file, messages] of this.logs.entries()) {
      const { dir, name } = path.parse(url2path(file))
      const logFilePath = path.join(dir, `${name}-log.yaml`)
      const contents = yaml.safeDump(messages, { skipInvalid: true })
      return fs.writeFile(logFilePath, contents)
    }
  }
}
