import * as childProcess from 'child_process'
import * as _ from 'lodash'
const commandJoin = require('command-join')
import * as crypto from 'crypto'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as readline from 'readline'
import * as yaml from 'js-yaml'

import { Reference } from '@dicy/types'

import { FileCache, FileType, Parser, ParserMatch } from './types'

export default class File {
  static DEFAULT_PARSING_MODE = 'default'
  static fileTypes: Map<string, FileType>

  // The complete and real file path in the file system.
  readonly realFilePath: string
  // The file path relative to the project root.
  readonly filePath: string
  // The main type of the file, i.e. LaTeX, BibTeX, ...
  type: string
  // An optional sub type. Usually the document class for LaTeX documents.
  subType: string | undefined
  // Last update time of the file.
  timeStamp: Date
  // If it is a virtual or a physical file. Virtual files are usually in-memory
  // copies of parsed files such as log files.
  virtual: boolean = false
  // Read only files cannot be deleted nor have their value changed
  readOnly: boolean = false
  // A hash of the file contents. Used to verify that file has actually changed
  // when the timestamp changes
  hash: string
  // Job names currently associated with the file.
  jobNames: Set<string> = new Set<string>()
  // Has the file been analyzed in the current cycle?
  analyzed: boolean = false
  // Has the file been updated in the current cycle?
  private _hasBeenUpdated: boolean = false
  // Has the file been changed during the current run?
  private hasBeenUpdatedCache: boolean = false
  // The value of the virtual file.
  private _value: any | undefined

  /**
   * Construct a new File. Because creating a file required asynchronous file
   * system access this method is used only to initialize the File instance. Used
   * the `create` method to actual create an instance.
   * @param  {string}    realFilePath The actual file system path.
   * @param  {string}    filePath     The file path relative to the project root.
   * @param  {FileCache} fileCache    The timestamp, hash and value provided by cache.
   */
  constructor (realFilePath: string, filePath: string, fileCache?: FileCache) {
    this.realFilePath = realFilePath
    this.filePath = filePath
    if (fileCache) {
      this.timeStamp = fileCache.timeStamp
      if (fileCache.hash) this.hash = fileCache.hash
      if (fileCache.value) this._value = fileCache.value
    }
  }

  /**
   * Create a new File.
   * @param  {string}    realFilePath The actual file system path.
   * @param  {string}    filePath     The file path relative to the project root.
   * @param  {FileCache} fileCache    The timestamp, hash and value provided by cache.
   * @return {File}                   The File instance.
   */
  static async create (realFilePath: string, filePath: string, fileCache?: FileCache): Promise<File | undefined> {
    const file: File = new File(realFilePath, filePath, fileCache)

    await file.findType()
    // If the file type is not a virtual file type and there is no physical file
    // then just quit.
    if (!file.virtual && !await File.canRead(realFilePath)) return undefined
    // Check for an update to file in case it has changed since the cache was
    // finalized.
    await file.update()

    return file
  }

  /**
   * Load the file types from the resource file `resources/file-types.yaml`
   */
  static async loadFileTypes (): Promise<void> {
    if (!this.fileTypes) {
      const fileTypesPath = path.resolve(__dirname, '..', 'resources', 'file-types.yaml')
      const value: {[name: string]: FileType} = (await this.readYaml(fileTypesPath)) as {[name: string]: FileType}

      // Create a new map and iterate through each type in the file and save it
      // to the map.
      this.fileTypes = new Map()
      for (const name in value) {
        this.fileTypes.set(name, value[name])
      }
    }
  }

  static read (filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: 'utf-8' }, (error, data) => {
        if (error) {
          reject(error)
        } else {
          resolve(data.toString())
        }
      })
    })
  }

  static async readYaml (filePath: string, fullSchema: boolean = true): Promise<any> {
    const contents = await File.read(filePath)
    return yaml.load(contents, {
      schema: fullSchema ? yaml.DEFAULT_FULL_SCHEMA : yaml.DEFAULT_SAFE_SCHEMA
    })
  }

  static async write (filePath: string, value: string): Promise<void> {
    await fs.mkdirp(path.dirname(filePath))
    await fs.writeFile(filePath, value, { encoding: 'utf-8' })
  }

  static async writeYaml (filePath: string, value: object, fullSchema: boolean = false): Promise<void> {
    const contents = yaml.dump(value, {
      skipInvalid: true,
      schema: fullSchema ? yaml.DEFAULT_FULL_SCHEMA : yaml.DEFAULT_SAFE_SCHEMA
    })
    await fs.mkdirp(path.dirname(filePath))
    await fs.writeFile(filePath, contents, { encoding: 'utf-8' })
  }

  static canRead (filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.access(filePath, fs.constants.R_OK, error => resolve(!error))
    })
  }

  static getModifiedTime (filePath: string): Promise<Date> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (error, stat) => resolve(error ? new Date() : stat.mtime))
    })
  }

  static isFile (filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (error, stat) => resolve(!error && stat.isFile()))
    })
  }

  static isDirectory (filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (error, stat) => resolve(!error && stat.isDirectory()))
    })
  }

  static remove (filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.remove(filePath, error => error ? reject(error) : resolve())
    })
  }

  static ensureDir (filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.ensureDir(filePath, error => error ? reject(error) : resolve())
    })
  }

  static copy (from: string, to: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.copy(from, to, error => error ? reject(error) : resolve())
    })
  }

  /**
   * Parse the file using a list of Parsers.
   * @param  {Parser[]}      parsers   List of parsers to apply.
   * @param  {string => boolean}  isWrapped A function to test for line wrapping.
   */
  parse (parsers: Parser[], isWrapped: (x: string) => boolean = line => false): Promise<void> {
    return new Promise((resolve, reject) => {
      // The maximum number of lines that we need to maintain in a buffer to
      // satisfy all the parsers.
      const bufferSize = parsers.reduce((current, parser) => Math.max(current, parser.patterns.length), 0)
      // A type representing an unwrapped line where `count` is the number of
      // wrapped lines in the file that each unwrapped line represents.
      type Line = { text: string, count: number }
      // The buffer of unwrapped lines.
      let lines: Line[] = []
      let lineNumber: number = 1
      let mode: string = ''
      let modeParsers: Parser[] = []
      const setMode = (newMode: string) => {
        mode = newMode
        modeParsers = parsers.filter(parser => (parser.modes || [File.DEFAULT_PARSING_MODE]).includes(mode))
      }
      // A function to check form matches in all the parsers.
      const checkForMatches = (finalCheck: boolean = false) => {
        while (lines.length > 0) {
          // If this is not the final check then do not check if there is not
          // enough lines in the buffer to check all parsers.
          if (!finalCheck && lines.length < bufferSize) break

          let matched: boolean = false

          for (const parser of modeParsers) {
            // If there is not enough lines to check this parser then skip it.
            if (parser.patterns.length > lines.length) continue

            const matches = parser.patterns.map((pattern, index) => lines[index].text.match(pattern))

            matched = matches.every(match => !!match)
            if (matched) {
              const parserMatch: ParserMatch = {
                _: matches.map(match => match ? match[0] : '').join('\n'),
                captures: [],
                groups: {}
              }
              if (parser.names) {
                let m: string[] = []
                m = m.concat(...matches.map(match => match ? match.slice(1) : []))
                const names = parser.names || []
                names.map((name, index) => {
                  if (m.length > index) parserMatch.groups[name] = m[index]
                })
              } else {
                let m: string[] = []
                m = m.concat(...matches.map(match => match || []))
                parserMatch.captures = m
              }
              const lineCount = lines.splice(0, parser.patterns.length).reduce((total, line) => total + line.count, 0)
              const reference: Reference = {
                file: this.filePath,
                range: {
                  start: lineNumber,
                  end: lineNumber + lineCount - 1
                }
              }
              lineNumber += lineCount
              const newMode: string | void = parser.evaluate(mode, reference, parserMatch)
              if (newMode) setMode(newMode)
              break
            }
          }
          if (!matched) {
            // No match so pop the leading line from the queue.
            lineNumber += lines[0].count
            lines.shift()
          }
        }
      }

      setMode(File.DEFAULT_PARSING_MODE)

      if (this.virtual) {
        const rawLines = this.value ? this.value.toString().split(/\r?\n/) : []
        lines = rawLines.map((text: string) => ({ text, count: 1 }))
        for (let index = lines.length - 1; index > -1; index--) {
          if (isWrapped(lines[index].text) && index + 1 < lines.length) {
            lines[index].text += lines[index + 1].text
            lines[index].count += lines[index + 1].count
            lines.splice(index + 1, 1)
          }
        }
        checkForMatches(true)
        resolve()
      } else {
        let current: Line = { text: '', count: 0 }
        const rl = readline.createInterface({
          input: fs.createReadStream(this.realFilePath, { encoding: 'utf-8' })
        })

        rl
          .on('line', line => {
            current.text += line
            current.count += 1
            if (!isWrapped(line)) {
              lines.push(current)
              current = { text: '', count: 0 }
              checkForMatches()
            }
          })
          .on('close', () => {
            checkForMatches(true)
            resolve()
          })
      }
    })
  }

  /**
   * Getter for `hasBeenUpdated`
   * @return {Boolean}  Update status.
   */
  get hasBeenUpdated (): boolean {
    return this._hasBeenUpdated
  }

  /**
   * Setter for `hasBeenUpdated`
   * @param {Boolean}  value  Update status.
   */
  set hasBeenUpdated (value: boolean) {
    this._hasBeenUpdated = value
    // Cache the update flag in case it gets reset in the cycle.
    this.hasBeenUpdatedCache = value || this.hasBeenUpdatedCache
  }

  restoreUpdateFlag (): void {
    this.hasBeenUpdated = this.hasBeenUpdatedCache
  }

  get value (): any | undefined {
    return this._value
  }

  set value (value: any | undefined) {
    if (this.readOnly) return
    if (!_.isEqual(value, this._value)) {
      this.hasBeenUpdated = true
      this.timeStamp = new Date()
    }
    this._value = value
  }

  /**
   * Find the type of a file by iterating through the available types and
   * testing each one.
   * @return {void}
   */
  async findType (): Promise<void> {
    // Make sure the file types are loaded
    await File.loadFileTypes()

    // Go through each file type and test each one. Break when we find a match.
    for (const [type, properties] of File.fileTypes.entries()) {
      if (await this.isFileType(type, properties)) break
    }
  }

  /**
   * Test a file to see if it matches the supplied FileType.
   * @param  {String}   name     The name of the file type
   * @param  {FileType} fileType The FileType descriptor
   * @return {Boolean}           True if the file matches the file type, false
   *                             otherwise.
   */
  async isFileType (name: string, fileType: FileType): Promise<boolean> {
    // If the file type descriptor does not have a pattern for the file name or
    // a pattern for the contents of the file then it must be a virtual file.
    if (!fileType.fileName && !fileType.contents) {
      // Test to see if the file path ends in the file type's name.
      const isMatch = this.realFilePath.endsWith(`-${name}`)
      if (isMatch) {
        // Its a match so set the file type.
        this.type = name
        this.virtual = true
      }
      return isMatch
    }

    // If file name does not match required pattern then just quit.
    if (fileType.fileName && !fileType.fileName.test(this.realFilePath)) {
      return false
    }

    // Does the file type descriptor require specific file contents pattern?
    if (fileType.contents) {
      // Make sure the file is readable.
      if (await this.canRead()) {
        const contents = await this.read()
        const [value = undefined, subType = undefined] = contents.match(fileType.contents || '') || []

        if (value) {
          // We have a match so set the type and sub type.
          this.type = name
          this.subType = subType
          return true
        }
      }
    } else {
      // No specific contents required so we have a successful match!
      this.type = name
      return true
    }

    return false
  }

  inTypeSet (types: Set<string>) {
    return types.has('*') || types.has(this.type)
  }

  async delete (): Promise<void> {
    if (!this.virtual) await File.remove(this.realFilePath)
  }

  /**
   * Update the file time stamp
   * @return {boolean}  true if time stamp has been updated, false otherwise.
   */
  async updateTimeStamp (): Promise<boolean> {
    // If it is a virtual file then we only update the time stamp when `value`
    // is set.
    if (this.virtual) return false

    // Save the old time stamp and get the current one.
    const oldTimeStamp = this.timeStamp
    this.timeStamp = await File.getModifiedTime(this.realFilePath)

    // Return true indicating an updated time stamp if there was no time stamp
    // before or the new time stamp is more recent.
    return !oldTimeStamp || oldTimeStamp < this.timeStamp
  }

  updateHash (): Promise<boolean> {
    const fileType = File.fileTypes.get(this.type)

    if (this.virtual || path.isAbsolute(this.filePath)) return Promise.resolve(true)

    return new Promise((resolve, reject) => {
      // const fileType = File.fileTypes.get(this.type)
      const hash = crypto.createHash('sha256')
      const finish = () => {
        const oldHash = this.hash
        this.hash = hash.digest('base64')
        resolve(oldHash !== this.hash)
      }

      if (fileType && fileType.hashFilter) {
        const command = commandJoin([fileType.hashFilter, this.realFilePath])
        childProcess.exec(command, {}, (error, stdout, stderr) => {
          if (error) {
            resolve(true)
          } else {
            for (const line of stdout.toString().split(/\n/g)) {
              if (!fileType.hashSkip || !fileType.hashSkip.test(line)) hash.update(line)
            }
            finish()
          }
        })
      } else if (fileType && fileType.hashSkip) {
        const rl = readline.createInterface({
          input: fs.createReadStream(this.realFilePath, { encoding: 'utf-8' })
        })

        rl
          .on('line', line => {
            if (!fileType.hashSkip || !fileType.hashSkip.test(line)) hash.update(line)
          })
          .on('close', finish)
      } else {
        fs.createReadStream(this.realFilePath)
          .on('data', data => hash.update(data))
          .on('end', finish)
      }
    })
  }

  async update (): Promise<boolean> {
    if (!await this.canRead()) return false
    const updated = await this.updateTimeStamp() && await this.updateHash()
    this.hasBeenUpdated = this.hasBeenUpdated || updated
    return updated
  }

  read (): Promise<string> {
    return File.read(this.realFilePath)
  }

  readYaml (): Promise<object> {
    return File.readYaml(this.realFilePath)
  }

  write (value: string): Promise<void> {
    return File.write(this.realFilePath, value)
  }

  canRead (): Promise<boolean> {
    return File.canRead(this.realFilePath)
  }

  copy (to: string): Promise<void> {
    return File.copy(this.realFilePath, to)
  }
}
