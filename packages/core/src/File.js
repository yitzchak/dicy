/* @flow */

import _ from 'lodash'
import crypto from 'crypto'
import fs from 'fs-extra'
import path from 'path'
import readline from 'readline'
import yaml from 'js-yaml'

import Rule from './Rule'

import type { FileType, Parser, References } from './types'

export default class File {
  static fileTypes: Map<string, FileType>

  // The complete and real file path in the file system.
  realFilePath: string
  // The file path relative to the project root.
  filePath: string
  // The main type of the file, i.e. LaTeX, BibTeX, ...
  type: string
  // An optional sub type. Usually the document class for LaTeX documents.
  subType: ?string
  // Last update time of the file.
  timeStamp: Date
  // If it is a virtual or a physical file. Virtual files are usually in-memory
  // copies of parsed files such as log files.
  virtual: boolean = false
  // A hash of the file contents. Used to verify that file has actually changed
  // when the timestamp changes
  hash: string
  // Rules that have the file as an input.
  rules: Set<Rule> = new Set()
  // Job names currently associated with the file.
  jobNames: Set<string> = new Set()
  // Has the file been analyzed in the current cycle?
  analyzed: boolean = false
  // Has the file been updated in the current cycle?
  _hasBeenUpdated: boolean = false
  // Has the file been changed during the current run?
  hasBeenUpdatedCache: boolean = false
  // The value of the virtual file.
  _value: ?any

  /**
   * Construct a new File. Because creating a file required asynchronous file
   * system access this method is used only to initialize the File instance. Used
   * the `create` method to actual create an instance.
   * @param  {string} realFilePath The actual file system path.
   * @param  {string} filePath     The file path relative to the project root.
   * @param  {Date}   timeStamp    The time of the last update provided by cache.
   * @param  {string} hash         The last content hash provided by cache.
   * @param  {any}    value        The value of the virtual file.
   */
  constructor (realFilePath: string, filePath: string, timeStamp: ?Date, hash: ?string, value: ?any) {
    this.realFilePath = realFilePath
    this.filePath = filePath
    if (timeStamp) this.timeStamp = timeStamp
    if (hash) this.hash = hash
    if (value) this._value = value
  }

  /**
   * Create a new File.
   * @param  {string} realFilePath The actual file system path.
   * @param  {string} filePath     The file path relative to the project root.
   * @param  {Date}   timeStamp    The time of the last update provided by cache.
   * @param  {string} hash         The last content hash provided by cache.
   * @param  {any}    value        The value of the virtual file.
   * @return {File}                The File instance.
   */
  static async create (realFilePath: string, filePath: string, timeStamp: ?Date, hash: ?string, value: ?any): Promise<?File> {
    const file: File = new File(realFilePath, filePath, timeStamp, hash, value)

    await file.findType()
    // If the file type is not a virtual file type and there is no physical file
    // then just quit.
    if (!file.virtual && !await File.canRead(realFilePath)) return
    // Check for an update to file in case it has changed since the cache was
    // finalized.
    file.hasBeenUpdated = await file.updateTimeStamp() && await file.updateHash()

    return file
  }

  /**
   * Parse the file using a list of Parsers.
   * @param  {Array<Parser>}      parsers   List of parsers to apply.
   * @param  {string => boolean}  isWrapped A function to test for line wrapping.
   */
  parse (parsers: Array<Parser>, isWrapped: string => boolean = line => false): Promise<void> {
    return new Promise((resolve, reject) => {
      // The maximum number of lines that we need to maintain in a buffer to
      // satisfy all the parsers.
      const bufferSize = parsers.reduce((current, parser) => Math.max(current, parser.patterns.length), 0)
      // A type representing an unwrapped line where `count` is the number of
      // wrapped lines in the file that each unwrapped line represents.
      type Line = { text: string, count: number }
      // The buffer of unwrapped lines.
      let lines: Array<Line> = []
      let lineNumber = 1
      // A function to check form matches in all the parsers.
      const checkForMatches = (finalCheck: boolean = false) => {
        while (lines.length > 0) {
          // If this is not the final check then do not check if there is not
          // enough lines in the buffer to check all parsers.
          if (!finalCheck && lines.length < bufferSize) break

          let matched: boolean = false

          for (const parser: Parser of parsers) {
            // If there is not enough lines to check this parser then skip it.
            if (parser.patterns.length > lines.length) continue

            const matches = parser.patterns.map((pattern, index) => lines[index].text.match(pattern))

            matched = matches.every(match => match)
            if (matched) {
              // $FlowIgnore
              const m = [].concat(...matches.map(match => match.slice(1)))
              const groups: Object = {}
              parser.names.map((name, index) => {
                if (m[index] !== undefined) groups[name] = m[index]
              })
              const lineCount = lines.splice(0, parser.patterns.length).reduce((total, line) => total + line.count, 0)
              const references: References = _.fromPairs([[
                this.filePath,
                {
                  start: lineNumber,
                  end: lineNumber + lineCount - 1
                }
              ]])
              lineNumber += lineCount
              parser.evaluate(references, groups)
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

      if (this.virtual) {
        const rawLines = this.value ? this.value.toString().split(/\r?\n/) : []
        lines = rawLines.map(text => ({ text, count: 1 }))
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

  inTypeSet (types: Set<string>) {
    return types.has('*') || types.has(this.type)
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

  get value (): ?any {
    return this._value
  }

  set value (value: ?any) {
    if (!_.isEqual(value, this._value)) {
      this.hasBeenUpdated = true
      this.timeStamp = new Date()
    }
    this._value = value
  }

  /**
   * Load the file types from the resource file `resources/file-types.yaml`
   */
  static async loadFileTypes (): Promise<void> {
    if (!this.fileTypes) {
      const fileTypesPath = path.resolve(__dirname, '..', 'resources', 'file-types.yaml')
      const value = await this.load(fileTypesPath)

      // Create a new map and iterate through each type in the file and save it
      // to the map.
      this.fileTypes = new Map()
      for (const name in value) {
        this.fileTypes.set(name, value[name])
      }
    }
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
  isFileType (name: string, fileType: FileType): Promise<boolean> {
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
      return Promise.resolve(isMatch)
    }

    return new Promise((resolve, reject) => {
      // If file name does not match required pattern then just quit.
      if (fileType.fileName && !fileType.fileName.test(this.realFilePath)) {
        return resolve(false)
      }

      // Does the file type descriptor require specific file contents pattern?
      if (fileType.contents) {
        // Make sure the file is readable.
        File.canRead(this.realFilePath).then(canRead => {
          if (canRead) {
            // Create a line reading interface and interate through the lines
            // looking for a content match.
            const rl = readline.createInterface({
              input: fs.createReadStream(this.realFilePath)
            })
            let match = false

            rl
              .on('line', line => {
                const [value, subType] = line.match(fileType.contents) || []
                if (value) {
                  // We have a match so set the type and sub type.
                  match = true
                  this.type = name
                  this.subType = subType
                  rl.close()
                }
              })
              .on('close', () => {
                resolve(match)
              })
          } else resolve(false)
        })
      } else {
        // No specific contents required so we have a successful match!
        this.type = name
        resolve(true)
      }
    })
  }

  async delete (): Promise<void> {
    if (!this.virtual) await File.remove(this.realFilePath)
  }

  addRule (rule: Rule): void {
    this.rules.add(rule)
  }

  removeRule (rule: Rule): void {
    this.rules.delete(rule)
  }

  async updateTimeStamp (): Promise<boolean> {
    if (this.virtual) return false
    const oldTimeStamp = this.timeStamp
    this.timeStamp = await File.getModifiedTime(this.realFilePath)
    return oldTimeStamp !== this.timeStamp
  }

  updateHash (): Promise<boolean> {
    if (this.virtual || path.isAbsolute(this.filePath)) return Promise.resolve(true)

    return new Promise((resolve, reject) => {
      const fileType = File.fileTypes.get(this.type)
      const hash = crypto.createHash('sha256')
      const finish = () => {
        const oldHash = this.hash
        this.hash = hash.digest('base64')
        resolve(oldHash !== this.hash)
      }

      if (fileType && fileType.hashSkip) {
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

  async update (): Promise<void> {
    const updated = await this.updateTimeStamp() && await this.updateHash()
    this.hasBeenUpdated = this.hasBeenUpdated || updated
  }

  static read (filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: 'utf-8' }, (error, data) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
    })
  }

  read (): Promise<string> {
    return File.read(this.realFilePath)
  }

  static async load (filePath: string): Promise<Object> {
    const contents = await File.read(filePath)
    return yaml.load(contents)
  }

  load (): Promise<Object> {
    return File.load(this.realFilePath)
  }

  static async safeLoad (filePath: string): Promise<Object> {
    const contents = await File.read(filePath)
    return yaml.safeLoad(contents)
  }

  safeLoad (): Promise<Object> {
    return File.safeLoad(this.realFilePath)
  }

  static write (filePath: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, value, { encoding: 'utf-8' }, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  write (value: string): Promise<void> {
    return File.write(this.realFilePath, value)
  }

  static async dump (filePath: string, value: Object): Promise<void> {
    const contents = yaml.dump(value, { skipInvalid: true })
    await fs.writeFile(filePath, contents)
  }

  static async safeDump (filePath: string, value: Object): Promise<void> {
    const contents = yaml.safeDump(value, { skipInvalid: true })
    await fs.writeFile(filePath, contents)
  }

  static canRead (filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.access(filePath, fs.constants.R_OK, error => resolve(!error))
    })
  }

  canRead (): Promise<boolean> {
    return File.canRead(this.realFilePath)
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

  copy (to: string): Promise<void> {
    return File.copy(this.realFilePath, to)
  }
}
