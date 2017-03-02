/* @flow */

import _ from 'lodash'
import crypto from 'crypto'
import fs from 'fs-extra'
import fsp from 'fs-promise'
import path from 'path'
import readline from 'readline'
import yaml from 'js-yaml'

import Rule from './Rule'

import type { FileType, Parser, Reference } from './types'

export default class File {
  static fileTypes: Map<string, FileType>

  realFilePath: string
  filePath: string
  type: string
  subType: ?string
  timeStamp: Date
  virtual: boolean = false
  hash: string
  rules: Set<Rule> = new Set()
  jobNames: Set<string> = new Set()
  analyzed: boolean = false
  _hasBeenUpdated: boolean = false
  hasBeenUpdatedCache: boolean = false
  _value: ?any

  constructor (realFilePath: string, filePath: string, timeStamp: ?Date, hash: ?string, value: ?any) {
    this.realFilePath = realFilePath
    this.filePath = filePath
    if (timeStamp) this.timeStamp = timeStamp
    if (hash) this.hash = hash
    if (value) this._value = value
  }

  static async create (realFilePath: string, filePath: string, timeStamp: ?Date, hash: ?string, value: ?any): Promise<?File> {
    const file: File = new File(realFilePath, filePath, timeStamp, hash, value)

    await file.findType()
    if (!file.virtual && !await File.canRead(realFilePath)) return
    file.hasBeenUpdated = await file.updateTimeStamp() && await file.updateHash()

    return file
  }

  parse (parsers: Array<Parser>, isWrapped: string => boolean = line => false): Promise<void> {
    return new Promise((resolve, reject) => {
      const bufferSize = parsers.reduce((current, parser) => Math.max(current, parser.patterns.length), 0)
      type foo = { text: string, count: number }
      let lines: Array<foo> = []
      let lineNumber = 1
      const checkForMatches = (finalCheck: boolean = false) => {
        while (lines.length > 0) {
          if (!finalCheck && lines.length < bufferSize) break
          let matched = false
          for (const parser: Parser of parsers) {
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
              const reference: Reference = {
                file: this.filePath,
                start: lineNumber,
                end: lineNumber + lineCount - 1
              }
              lineNumber += lineCount
              parser.evaluate(reference, groups)
              break
            }
          }
          if (!matched) {
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
        let current: foo = { text: '', count: 0 }
        const rl = readline.createInterface({
          input: fsp.createReadStream(this.realFilePath, { encoding: 'utf-8' })
        })

        rl.on('line', line => {
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

  get hasBeenUpdated (): boolean {
    return this._hasBeenUpdated
  }

  set hasBeenUpdated (value: boolean) {
    this._hasBeenUpdated = value
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

  async findType (): Promise<void> {
    if (!File.fileTypes) {
      const fileTypesPath = path.resolve(__dirname, '..', 'resources', 'file-types.yaml')
      const value = await File.load(fileTypesPath)
      File.fileTypes = new Map()
      for (const name in value) {
        File.fileTypes.set(name, value[name])
      }
    }

    for (const [type, properties] of File.fileTypes.entries()) {
      if (await this.isFileType(type, properties)) break
    }
  }

  isFileType (name: string, fileType: FileType): Promise<boolean> {
    if (!fileType.fileName && !fileType.contents) {
      const isMatch = this.realFilePath.endsWith(`-${name}`)
      if (isMatch) {
        this.type = name
        this.virtual = true
      }
      return Promise.resolve(isMatch)
    }

    return new Promise((resolve, reject) => {
      if (fileType.fileName && !fileType.fileName.test(this.realFilePath)) {
        return resolve(false)
      }

      if (fileType.contents) {
        File.canRead(this.realFilePath).then(canRead => {
          if (canRead) {
            const rl = readline.createInterface({
              input: fsp.createReadStream(this.realFilePath)
            })
            let match = false

            rl.on('line', line => {
              const [value, subType] = line.match(fileType.contents) || []
              if (value) {
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
        this.type = name
        resolve(true)
      }
    })
  }

  async delete (): Promise<void> {
    if (!this.virtual) await fsp.unlink(this.realFilePath)
  }

  addRule (rule: Rule): void {
    this.rules.add(rule)
  }

  removeRule (rule: Rule): void {
    this.rules.delete(rule)
  }

  async updateTimeStamp (): Promise<boolean> {
    if (this.virtual) return false
    const stats = await fsp.stat(this.realFilePath)
    const oldTimeStamp = this.timeStamp
    this.timeStamp = stats.mtime
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
          input: fsp.createReadStream(this.realFilePath, { encoding: 'utf-8' })
        })
        rl.on('line', line => {
          if (!fileType.hashSkip || !fileType.hashSkip.test(line)) hash.update(line)
        })
        .on('close', finish)
      } else {
        fsp.createReadStream(this.realFilePath)
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
}
