/* @flow */

import fastGlob from 'fast-glob'
import fs from 'fs-promise'
import micromatch from 'micromatch'
import path from 'path'

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class Clean extends Rule {
  static commands: Set<Command> = new Set(['clean'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Clean up a previous build.'

  async run () {
    const deepClean: boolean = this.options.deepClean
    const generatedFiles: Set<File> = new Set()
    const files: Set<File> = new Set()
    const directories: Set<string> = new Set()

    if (deepClean) {
      directories.add(this.resolvePath('$name-cache.yaml'))
    }

    for (const rule of this.rules) {
      if (rule.jobName === this.jobName) {
        for (const file of rule.outputs.values()) {
          if (file.virtual) continue
          if (deepClean) {
            files.add(file)
          } else {
            generatedFiles.add(file)
          }
        }
      }
    }

    for (const pattern of this.options.cleanPatterns) {
      if (/^[/\\]/.test(pattern)) {
        for (const matchedFilePath of await this.globPath(pattern.substring(1))) {
          const filePath = path.resolve(this.rootPath, matchedFilePath)
          const stat = await fs.stat(filePath)
          if (stat.isFile()) {
            const file = await this.getFile(matchedFilePath)
            if (file) files.add(file)
          } else if (stat.isDirectory()) {
            directories.add(filePath)
          }
        }
      } else if (!deepClean && generatedFiles.size !== 0) {
        const isMatch = micromatch.matcher(this.resolvePath(pattern), { dot: true })
        for (const file of generatedFiles.values()) {
          if (isMatch(file.filePath)) {
            files.add(file)
          }
        }
      }
    }

    for (const file of files.values()) {
      await this.buildState.deleteFile(file, this.jobName)
    }

    for (const filePath of directories) {
      await fs.remove(path.resolve(this.rootPath, filePath))
      this.emit('fileDeleted', { type: 'fileDeleted', file: filePath })
    }

    const candidateDirectories = await fastGlob('**/*', { cwd: this.rootPath, onlyDirs: true, bashNative: [] })
    candidateDirectories.reverse()

    for (const filePath of candidateDirectories) {
      const realFilePath = path.resolve(this.rootPath, filePath)
      const contents = await fs.readdir(realFilePath)
      if (contents.length === 0) {
        await fs.remove(realFilePath)
        this.emit('fileDeleted', { type: 'fileDeleted', file: filePath })
      }
    }

    return true
  }
}