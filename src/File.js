/* @flow */

import _ from 'lodash'
import crypto from 'crypto'
import fs from 'mz/fs'
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
  timeStamp: Date
  virtual: boolean = false
  useHash: boolean = false
  hash: string
  rules: Set<Rule> = new Set()
  jobNames: Set<string> = new Set()
  analyzed: boolean = false
  hasBeenUpdated: boolean = false
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

  parse (parsers: Array<Parser>): Promise<void> {
    return new Promise((resolve, reject) => {
      const bufferSize = parsers.reduce((current, parser) => Math.max(current, parser.patterns.length), 0)
      const lines = []
      let lineNumber = 1
      const rl = readline.createInterface({
        input: fs.createReadStream(this.filePath, { encoding: 'utf-8' })
      })

      rl.on('line', line => {
        lines.push(line)
        if (lines.length === bufferSize) {
          let matched = false
          for (const parser: Parser of parsers) {
            const matches = parser.patterns.map((pattern, index) => lines[index].match(pattern))
            matched = matches.every(match => match)
            if (matched) {
              const m = [].concat(...matches.map(match => match.slice(1)))
              const groups: Object = {}
              parser.names.map((name, index) => {
                if (m[index] !== undefined) groups[name] = m[index]
              })
              const reference: Reference = {
                file: this.normalizedFilePath,
                start: lineNumber,
                end: lineNumber + parser.patterns.length - 1
              }
              lines.splice(0, parser.patterns.length)
              lineNumber += parser.patterns.length
              parser.evaluate(reference, groups)
              break
            }
          }
          if (!matched) {
            lines.shift()
            lineNumber++
          }
        }
      })
      .on('close', () => {
        resolve()
      })
    })
  }

  get value (): ?any {
    return this._value
  }

  set value (value: ?any) {
    if (!_.isEqual(value, this._value)) {
      this.hasBeenUpdated = true
    }
    this.timeStamp = new Date()
    this._value = value
  }

  exists () {
    return fs.exists(this.filePath)
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
      if (await this.isFileType(type, properties)) {
        this.type = type
        this.virtual = !!properties.virtual
        this.useHash = !!properties.hash
        break
      }
    }
  }

  isFileType (name: string, fileType: FileType): Promise<boolean> {
    if (fileType.virtual) return Promise.resolve(this.filePath.endsWith(`-${name}`))

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
              if (fileType.contents && fileType.contents.test(line)) {
                match = true
                rl.close()
              }
            })
            .on('close', () => {
              resolve(match)
            })
          } else resolve(false)
        })
      } else {
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
    if (this.virtual || !this.useHash) return Promise.resolve(true)

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

  forceUpdate () {
    this.timeStamp = new Date()
    this.hasBeenUpdated = true
  }
}
