/* @flow */

import _ from 'lodash'
import crypto from 'crypto'
import fs from 'fs-promise'
import path from 'path'
import readline from 'readline'
import yaml from 'js-yaml'

import Rule from './Rule'

import type { FileType, Parser, Reference } from './types'

export default class File {
  static fileTypes: Map<string, FileType>

  filePath: string
  normalizedFilePath: string
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

  constructor (filePath: string, normalizedFilePath: string, timeStamp: ?Date, hash: ?string, value: ?any) {
    this.filePath = filePath
    this.normalizedFilePath = normalizedFilePath
    if (timeStamp) this.timeStamp = timeStamp
    if (hash) this.hash = hash
    if (value) this._value = value
  }

  static async create (filePath: string, normalizedFilePath: string, timeStamp: ?Date, hash: ?string, value: ?any): Promise<?File> {
    const file: File = new File(filePath, normalizedFilePath, timeStamp, hash, value)

    await file.findType()
    if (!file.virtual && !await fs.exists(filePath)) return
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
                file: this.normalizedFilePath,
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
          input: fs.createReadStream(this.filePath, { encoding: 'utf-8' })
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
      const contents = await fs.readFile(path.resolve(__dirname, '..', 'resources', 'file-types.yaml'), { encoding: 'utf-8' })
      const value = yaml.load(contents)
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
      const isMatch = this.filePath.endsWith(`-${name}`)
      if (isMatch) {
        this.type = name
        this.virtual = true
      }
      return Promise.resolve(isMatch)
    }

    return new Promise((resolve, reject) => {
      if (fileType.fileName && !fileType.fileName.test(this.filePath)) {
        return resolve(false)
      }

      if (fileType.contents) {
        fs.exists(this.filePath).then(exists => {
          if (exists) {
            const rl = readline.createInterface({
              input: fs.createReadStream(this.filePath)
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

  addRule (rule: Rule): void {
    this.rules.add(rule)
  }

  async updateTimeStamp (): Promise<boolean> {
    if (this.virtual) return false
    const stats = await fs.stat(this.filePath)
    const oldTimeStamp = this.timeStamp
    this.timeStamp = stats.mtime
    return oldTimeStamp !== this.timeStamp
  }

  updateHash (): Promise<boolean> {
    if (this.virtual || path.isAbsolute(this.normalizedFilePath)) return Promise.resolve(true)

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
          input: fs.createReadStream(this.filePath, { encoding: 'utf-8' })
        })
        rl.on('line', line => {
          if (!fileType.hashSkip || !fileType.hashSkip.test(line)) hash.update(line)
        })
        .on('close', finish)
      } else {
        fs.createReadStream(this.filePath)
          .on('data', data => hash.update(data))
          .on('end', finish)
      }
    })
  }

  async update (): Promise<void> {
    const updated = await this.updateTimeStamp() && await this.updateHash()
    this.hasBeenUpdated = this.hasBeenUpdated || updated
  }
}
