import chalk from 'chalk'
const url2path = require('file-uri-to-path')
const fileUrl = require('file-url')
import * as fs from 'fs-extra'
import * as yaml from 'js-yaml'
import * as _ from 'lodash'
import * as path from 'path'
const stringWidth = require('string-width')
const yargs = require('yargs/yargs')
const wrapAnsi = require('wrap-ansi')

import {
  getOptionDefinitions,
  Command,
  DiCy,
  Message,
  OptionDefinition,
  Reference,
  Uri
} from '@dicy/core'

// Function to right pad a string based on the string width reported by then
// string-width module.
function padEnd (text: string, size: number): string {
  return text + ' '.repeat(Math.max(size - stringWidth(text), 0))
}

export default class Program {
  // List commands associated with each alias.
  commandLists: any = {}
  // The black box that makes it all happen.
  dicy = new DiCy()
  // All messages associated with each input in case `--save-logs` is set.
  logs: Map<Uri, Message[]> = new Map<Uri, Message[]>()
  // Option definitions used to construct yargs options and help messages.
  optionDefinitions: OptionDefinition[] = []
  // Actual option names used by DiCy indexed by command line form. For
  // instance, `{ 'foo2bar-quux': 'foo2barQuux' }`
  optionNames: {[name: string]: string} = {}
  // Severity labels. Right padding will be added in the constructor.
  severityLabels: { [severity: string]: string } = {
    trace: chalk.green('TRACE'),
    info: chalk.blue('INFO'),
    warning: chalk.yellow('WARNING'),
    error: chalk.red('ERROR')
  }
  // A newline with the corrent padding to make the columns line up.
  textNewLine: string
  // Width of the text message column.
  textWidth: number
  // Shiver me timbers, there be a foul wind off the port bow! Batten down the
  // hatches lest we sleep in Davy Jones' locker!
  yargs: any

  constructor (args: string[] = []) {
    // Calculate the width of the terminal and the width of the severity column.
    const totalWidth: number = Math.min(Math.max(process.stdout.columns || 80, 80), 132)
    const severityWidth = Object.values(this.severityLabels).reduce((width, label) => Math.max(width, stringWidth(label)), 0) + 2

    // Pad the severity labels.
    for (const label in this.severityLabels) {
      this.severityLabels[label] = padEnd(this.severityLabels[label], severityWidth)
    }

    // Create a spacer for line breaks in the text column
    this.textNewLine = '\n' + ' '.repeat(severityWidth)

    // Calculate the width of the text column
    this.textWidth = totalWidth - severityWidth

    // Listen to the log event on DiCy.
    this.dicy.on('log', (file: Uri, messages: Message[]) => {
      this.saveMessages(file, messages)
      this.printMessages(file, messages)
    })

    // Common initialization for yargs.
    this.yargs = yargs(args)
    this.yargs
      .wrap(totalWidth)
      .usage('DiCy - A builder for LaTeX, knitr, literate Agda, literate Haskell and Pweave that automatically builds dependencies.')
      .demandCommand(1, 'You need to specify a command.')
      .recommendCommands()
      .help()
  }

  async destroy (): Promise<void> {
    await this.dicy.killAll()
    await this.dicy.destroy()
  }

  getOptions (commands: Command[]): { [name: string]: any } {
    const options: { [name: string]: any } = {
      'save-log': {
        boolean: true,
        description: 'Save the log as a YAML file <name>-log.yaml.'
      }
    }

    for (const definition of this.optionDefinitions) {
      // Skip environment variables or options that are not applicable to this
      // command
      if (definition.name.startsWith('$') ||
        (definition.commands && !definition.commands.some(command => commands.includes(command as Command)))) continue

      const addOption = (name: string, option: any): void => {
        this.optionNames[name] = definition.name
        if (definition.values) {
          option.choices = definition.values
        }
        options[name] = option
      }
      // Make a kebab but don't skewer the numbers.
      const name = _.kebabCase(definition.name).replace(/(?:^|-)([0-9]+)(?:$|-)/g, '$1')
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

  /**
   * Create a command from a command list and a description.
   * @param {Command[]} commands    List of commands. Does not include load or
   *                                save commands.
   * @param {string}    description The command description.
   */
  createCommand (commands: Command[], description: string): void {
    // Create a command name and alias
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
        handler: (argv: any) => this.commandHandler(argv)
      })
  }

  /**
   * Start the program. This loads the options definitions, creates the commands
   * definitions, parses the command line, and runs the appropriate command.
   * @return {Promise<void>}
   */
  async start (): Promise<void> {
    // Load the option definitions.
    this.optionDefinitions = await getOptionDefinitions()

    // Create the command definitions.
    this.createCommand(['build'],
      'Build the inputs.')
    this.createCommand(['clean'],
      'Clean up after a previous build.')
    this.createCommand(['scrub'],
      'Clean up generated files after a previous build.')
    this.createCommand(['log'],
      'Report messages from any logs.')
    this.createCommand(['graph'],
      'Create a dependency graph from a previous build.')
    this.createCommand(['build', 'clean'],
      'Build the inputs and then clean up.')
    this.createCommand(['build', 'log'],
      'Build the inputs and report messages from any logs.')
    this.createCommand(['build', 'log', 'clean'],
      'Build the inputs, report messages from any logs, and then clean up.')

    // Parse the command line and run the command.
    /* tslint:disable:no-unused-expression */
    this.yargs.argv
  }

  /**
   * Saves the messages from a log event in case `--save-logs` is set.
   * @param {Uri}       file     Primary build file.
   * @param {Message[]} messages Array of new messages.
   */
  saveMessages (file: Uri, messages: Message[]): void {
    const current = this.logs.get(file) || []
    this.logs.set(file, current.concat(messages))
  }

  referenceToString (reference: Reference | undefined, label: string): string {
    if (!reference) return ''
    const start = reference.range && reference.range.start
      ? ` @ ${reference.range.start}`
      : ''
    const end = reference.range && reference.range.end && reference.range.end !== reference.range.start
      ? `-${reference.range.end}`
      : ''
    return chalk.dim(`\n[${label}] ${reference.file}${start}${end}`)
  }

  /**
   * Print a message from a log event.
   * @param {Uri}       file     Primary build file.
   * @param {Message}   message  New message.
   */
  printMessage (file: Uri, message: Message): void {
    const origin: string = (message.name || message.category) ? `[${message.name}${message.category ? '/' : ''}${message.category || ''}] ` : ''
    const source: string = this.referenceToString(message.source, 'Source')
    const log: string = this.referenceToString(message.log, 'Log')
    const text: string = wrapAnsi(origin + message.text + source + log, this.textWidth)

    console.log(this.severityLabels[message.severity] + text.replace(/\n/g, this.textNewLine))
  }

  /**
   * Print the messages from a log event.
   * @param {Uri}       file     Primary build file.
   * @param {Message[]} messages Array of new messages.
   */
  printMessages (file: Uri, messages: Message[]): void {
    for (const message of messages) {
      this.printMessage(file, message)
    }
  }

  async commandHandler (argv: { [name: string]: any }) {
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

  async saveLogs (): Promise<void> {
    for (const [file, messages] of this.logs.entries()) {
      const { dir, name } = path.parse(url2path(file))
      const logFilePath = path.join(dir, `${name}-log.yaml`)
      const contents = yaml.safeDump(messages, { skipInvalid: true })
      await fs.writeFile(logFilePath, contents)
    }
  }
}
