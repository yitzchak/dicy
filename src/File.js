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
  hasTriggeredEvaluation: boolean = false
  contents: ?Object

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
    const stats = await fs.stat(this.filePath)
    const oldTimeStamp = this.timeStamp
    this.timeStamp = stats.mtime
    return oldTimeStamp !== this.timeStamp
  }

  updateHash (): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')

      fs.createReadStream(this.filePath)
        .on('data', data => hash.update(data))
        .on('end', () => {
          const oldHash = this.hash
          this.hash = hash.digest('base64')
          resolve(oldHash !== this.hash)
        })
    })
  }

  async update (): Promise<void> {
    const updated = await this.updateTimeStamp() && await this.updateHash()
    this.hasBeenUpdated = this.hasBeenUpdated || updated
  }
}
