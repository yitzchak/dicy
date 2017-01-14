/* @flow */

import crypto from 'crypto'
import fs from 'mz/fs'
import path from 'path'
import readline from 'readline'
import yaml from 'js-yaml'

import Rule from './Rule'

import type { FileType } from './types'

export default class File {
  static fileTypes: Map<string, FileType>

  filePath: string
  normalizedFilePath: string
  type: string
  timeStamp: Date
  hash: string
  rules: Set<Rule> = new Set()
  analyzed: boolean = false
  hasBeenUpdated: boolean = false
  _contents: ?Object

  constructor (filePath: string, normalizedFilePath: string, timeStamp: ?Date, hash: ?string) {
    this.filePath = filePath
    this.normalizedFilePath = normalizedFilePath
    if (timeStamp) this.timeStamp = timeStamp
    if (hash) this.hash = hash
  }

  static async create (filePath: string, normalizedFilePath: string, requireExistance: boolean = false, timeStamp: ?Date, hash: ?string): Promise<?File> {
    if (requireExistance && !await fs.exists(filePath)) return

    const file: File = new File(filePath, normalizedFilePath, timeStamp, hash)

    await file.findType()
    file.hasBeenUpdated = await file.updateTimeStamp() && await file.updateHash()

    return file
  }

  exists () {
    return fs.exists(this.filePath)
  }

  get isVirtual (): boolean {
    return !!this.contents
  }

  get contents (): ?Object {
    return this._contents
  }

  async setContents (value: ?Object): Promise<void> {
    this._contents = value
    if (value !== undefined) {
      this.timeStamp = new Date()
      this.hasBeenUpdated = await this.updateHash()
    } else {
      delete this.timeStamp
      delete this.hash
    }
  }

  async findType (): Promise<void> {
    if (!File.fileTypes) {
      const contents = await fs.readFile(path.resolve(__dirname, '..', 'resources', 'file-types.yaml'))
      const value = yaml.load(contents)
      File.fileTypes = new Map()
      for (const name in value) {
        File.fileTypes.set(name, value[name])
      }
    }

    for (const [type, properties] of File.fileTypes.entries()) {
      if (await this.isFileType(properties)) {
        this.type = type
        break
      }
    }
  }

  isFileType (fileType: FileType): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (fileType.fileName && !fileType.fileName.test(this.filePath)) {
        return resolve(false)
      }

      if (fileType.contents) {
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
      } else {
        resolve(true)
      }
    })
  }

  addRule (rule: Rule): void {
    this.rules.add(rule)
  }

  async updateTimeStamp (): Promise<boolean> {
    if (this._contents !== undefined) return false

    try {
      const stats = await fs.stat(this.filePath)
      const oldTimeStamp = this.timeStamp
      this.timeStamp = stats.mtime
      return oldTimeStamp !== this.timeStamp
    } catch (error) {}

    return false
  }

  updateHash (): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const finish = () => {
        const oldHash = this.hash
        this.hash = hash.digest('base64')
        resolve(oldHash !== this.hash)
      }

      if (this.contents) {
        hash.update(this.contents.toString())
        finish()
      } else {
        fs.createReadStream(this.filePath)
          .on('data', data => hash.update(data))
          .on('end', finish)
      }
    })
  }

  async update (): Promise<void> {
    this.hasBeenUpdated = this.hasBeenUpdated ||
      (await this.updateTimeStamp() && await this.updateHash())
  }
}
