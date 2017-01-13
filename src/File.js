/* @flow */

import crypto from 'crypto'
import Rule from './Rule'
import fs from 'mz/fs'
import readline from 'readline'
import type { FileType } from './types'

export default class File {
  static fileTypes: Map<string, FileType> = new Map([[
    'LaTeX', {
      namePattern: /\.tex$/i,
      contentsPattern: /^\\documentclass/m
    }
  ], [
    'LaTeX log', {
      namePattern: /\.log/i,
      contentsPattern: /^This is (pdf|e-u?pTeX|Lua|Xe)?TeX,/
    }
  ]])

  filePath: string
  normalizedFilePath: string
  type: string
  timeStamp: Date
  hash: string
  rules: Array<Rule> = []
  analyzed: boolean = false
  hasBeenUpdated: boolean = false

  constructor (filePath: string, normalizedFilePath: string, timeStamp: ?Date, hash: ?string) {
    this.filePath = filePath
    this.normalizedFilePath = normalizedFilePath
    if (timeStamp) this.timeStamp = timeStamp
    if (hash) this.hash = hash
  }

  static async create (filePath: string, normalizedFilePath: string, timeStamp: ?Date, hash: ?string) {
    const file = new File(filePath, normalizedFilePath, timeStamp, hash)

    await file.findType()
    file.hasBeenUpdated = await file.updateTimeStamp() && await file.updateHash()

    return file
  }

  async findType () {
    for (const [type, properties] of File.fileTypes.entries()) {
      if (await this.isFileType(properties)) {
        this.type = type
        break
      }
      // if (properties.namePattern && !properties.namePattern.test(this.filePath)) {
      //   continue
      // }
      // 
      // const contents = await fs.readFile(this.filePath, { encoding: 'utf-8' })
      // 
      // if (properties.contentsPattern && !properties.contentsPattern.test(contents)) {
      //   continue
      // }
      // 
      // this.type = type
      // break
    }
  }

  isFileType (fileType: FileType): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (fileType.namePattern && !fileType.namePattern.test(this.filePath)) {
        return resolve(false)
      }

      if (fileType.contentsPattern) {
        const rl = readline.createInterface({
          input: fs.createReadStream(this.filePath)
        })
        let match = false

        rl.on('line', line => {
          if (fileType.contentsPattern.test(line)) {
            match = true
            rl.close()
          }
        })
        .on('close', () => {
          resolve(match)
        })
        resolve(true)
      } else {
      }
    })
  }

  addRule (rule: Rule) {
    this.rules.push(rule)
  }

  async updateTimeStamp () {
    const stats = await fs.stat(this.filePath)
    const oldTimeStamp = this.timeStamp
    this.timeStamp = stats.mtime
    return oldTimeStamp !== this.timeStamp
  }

  updateHash () {
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

  async update () {
    this.hasBeenUpdated = this.hasBeenUpdated ||
      (await this.updateTimeStamp() && await this.updateHash())
  }
}
