const chalk = require('chalk')
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
  getOptionDefinitions, Command, DiCy, Message, OptionDefinition, Reference, Uri
} from '@dicy/core'

const COMMANDS: Command[] = ['build', 'clean', 'graph', 'log', 'open', 'scrub', 'test']
const ABBREVIATED_COMMANDS_PATTERN: RegExp = new RegExp(`^[${COMMANDS.map(command => command.substr(0, 1)).join('')}]+$`)

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

  /**
   * Destroy everything!!
   */
  async destroy (): Promise<void> {
    await this.dicy.destroy()
  }

  /**
   * Get the command line options associated with a specific OptionDefinition.
   * Multiple options will be returned for boolean options.
   * @param  {OptionDefinition}          definition The definition of the option.
   * @return {{ [name: string ]: any }}             The command line options.
   */
  getOptions (definition: OptionDefinition): { [name: string ]: any } {
    const options: { [name: string ]: any } = {}
    // Make a kebab but don't skewer the numbers.
    const name: string = _.kebabCase(definition.name).replace(/(?:^|-)([0-9]+)(?:$|-)/g, '$1')
    const negatedName: string = `no-${name}`
    const description: string = definition.description
    // Only include the aliases that are a single letter.
    const alias: string[] = (definition.aliases || []).filter(alias => alias.length === 1)

    switch (definition.type) {
      case 'strings':
        options[name] = { type: 'array', alias, description }
        break
      case 'number':
        options[name] = { type: 'number', alias, description }
        break
      case 'boolean':
        if (definition.defaultValue) {
          // The default value is true so the negated option gets the aliases
          // and the description while the non-negated option is hidden.
          options[name] = { type: 'boolean', hidden: true }
          options[negatedName] = {
            type: 'boolean',
            alias,
            description: description.replace('Enable', 'Disable')
          }
        } else {
          // The default value is false so the non-negated option gets the
          // aliases and the description while the negated option is hidden.
          options[negatedName] = { type: 'boolean', hidden: true }
          options[name] = { type: 'boolean', alias, description }
        }
        break
      case 'string':
        options[name] = { type: 'string', alias, description }
        break
    }

    // Make an index of the option names and add choices for enumerations.
    for (const name in options) {
      this.optionNames[name] = definition.name
      if (definition.values) {
        options[name].choices = definition.values
      }
    }

    return options
  }

  /**
   * Get all command line options.
   * @return {{ [name: string ]: any }} The command line options.
   */
  getAllOptions (): { [name: string]: any } {
    const options: { [name: string]: any } = {
      'save-log': {
        boolean: true,
        description: 'Save the log as a YAML file <name>-log.yaml.'
      }
    }

    // Skip environment variables
    Object.assign(options,
      ...this.optionDefinitions
        .filter(definition => !definition.name.startsWith('$'))
        .map(definition => this.getOptions(definition)))

    return options
  }

  /**
   * Initialize the program. This loads the options definitions and creates the
   * command definition.
   * @return {Promise<void>}
   */
  async initialize (): Promise<void> {
    // Load the option definitions.
    this.optionDefinitions = await getOptionDefinitions()

    // Setup the default command with a function to coerce and validate the
    // command list.
    this.yargs.command({
      command: `$0 <commands> <inputs...>`,
      describe: 'Run a series of commands on the supplied inputs.',
      builder: (yargs: any) => {
        return yargs
          .positional('commands', {
            type: 'string',
            describe: 'A command or a list commands to run. Possible values ' +
              'include "build", "clean", "graph", "log", "open", "scrub" or ' +
              '"test". Commands ' +
              'may be abbreviated by using the first letter of command. A ' +
              'sequence of commands may be composed by separating the commands ' +
              'with commmands, i.e. "build,log,clean". Command abbreviations ' +
              'may be combined without separating commands. For instance, "blc" ' +
              'is equivalent to "build,log,clean".',
            coerce: (arg: string): string[] => {
              // If the command string is clearly a concatenation of
              // abbreviated commands then split on character boundry,
              // otherwise split on commas.
              const abbreviatedCommands: string[] = arg.split(ABBREVIATED_COMMANDS_PATTERN.test(arg) ? '' : ',')

              // Lookup each command in the list of allowed commands.
              return abbreviatedCommands.map(abbreviatedCommand => {
                const command: string | undefined = COMMANDS.find(pc => pc.startsWith(abbreviatedCommand))
                if (!command) throw new TypeError(`Unknown command: ${abbreviatedCommand}`)
                return command
              })
            }
          })
          .positional('inputs', {
            type: 'string',
            describe: 'Input files to run commands on.'
          })
          .options(this.getAllOptions())
          .epilogue('All boolean options can be negated by adding or removing the `no-` prefix.')
      }
    })
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

  /**
   * Create string representation of a reference and return an empty string if
   * the reference is missing.
   * @param  {Reference | undefined} reference The reference.
   * @param  {string}                label     A label to describe the reference.
   * @return {string}                          The string representing the reference.
   */
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

  /**
   * Processes a command with arguments supplied by the option parser.
   * @param  {object} argv  The arguments
   */
  async run (argv: { [name: string]: any }): Promise<boolean> {
    const saveLog: boolean = !!argv['save-log']
    const options: {[name: string]: any} = {}
    const commands: Command[] = ['load'].concat(argv.commands, ['save']) as Command[]
    const files: Uri[] = (argv.inputs || []).map(fileUrl)

    this.initializeLogs(files)

    for (const name in argv) {
      const value = argv[name]
      if (name in this.optionNames && value !== undefined && value !== false) {
        options[this.optionNames[name]] = name.startsWith('no-') ? !argv[name] : argv[name]
      }
    }

    // Set all the instance options at once.
    await Promise.all(files.map(file => this.dicy.setInstanceOptions(file, options)))

    // Start the builds concurrently.
    const success: boolean = (await Promise.all(files.map(file => this.dicy.run(file, commands)))).every(x => x)

    if (saveLog) await this.saveLogs()

    await this.dicy.destroy()

    return success
  }

  /**
   * Reset all saved logs.
   * @param  {Uri[]}  files The files that need logs.
   */
  initializeLogs (files: Uri[]): void {
    for (const file of files) {
      this.logs.set(file, [])
    }
  }

  /**
   * Save the logs by file.
   */
  async saveLogs (): Promise<void> {
    for (const [file, messages] of this.logs.entries()) {
      const { dir, name } = path.parse(url2path(file))
      const logFilePath = path.join(dir, `${name}-log.yaml`)
      const contents = yaml.safeDump(messages, { skipInvalid: true })
      await fs.writeFile(logFilePath, contents)
    }
  }

  /**
   * Start the command line interface.
   * @return {Promise<boolean>} The build status.
   */
  async start (): Promise<boolean> {
    await this.initialize()
    return this.run(this.yargs.argv)
  }
}
