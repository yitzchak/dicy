/* @flow */

import fastGlob from 'fast-glob'
import micromatch from 'micromatch'
import path from 'path'
import readdir from 'readdir-enhanced'

import File from '../File'
import Rule from '../Rule'

import type { Command } from '../types'

export default class Clean extends Rule {
  static commands: Set<Command> = new Set(['clean', 'scrub'])
  static alwaysEvaluate: boolean = true
  static description: string = 'Clean up a previous build.'

  async run () {
    const scrub: boolean = this.command === 'scrub'
    const generatedFiles: Set<File> = new Set()
    const files: Set<File> = new Set()
    const directories: Set<string> = new Set()

    if (scrub) {
      directories.add(this.resolvePath('$NAME-cache.yaml'))
    }

    for (const rule of this.rules) {
      if (rule.jobName === this.jobName) {
        for (const file of rule.outputs) {
          if (file.virtual) continue
          if (scrub) {
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
          if (await File.isFile(filePath)) {
            const file = await this.getFile(matchedFilePath)
            if (file) files.add(file)
          } else if (await File.isDirectory(filePath)) {
            directories.add(filePath)
          }
        }
      } else if (!scrub && generatedFiles.size !== 0) {
        const isMatch = micromatch.matcher(this.resolvePath(pattern), { dot: true })
        for (const file of generatedFiles.values()) {
          if (isMatch(file.filePath)) {
            files.add(file)
          }
        }
      }
    }

    for (const file of files.values()) {
      await this.state.deleteFile(file, this.jobName)
    }

    for (const filePath of directories) {
      await File.remove(path.resolve(this.rootPath, filePath))
      this.emit('fileDeleted', { type: 'fileDeleted', file: filePath })
    }

    const candidateDirectories = await fastGlob('**/*', { cwd: this.rootPath, onlyDirs: true, bashNative: [] })
    candidateDirectories.reverse()

    for (const filePath of candidateDirectories) {
      const realFilePath = path.resolve(this.rootPath, filePath)
      const contents = await readdir.async(realFilePath)
      if (contents.length === 0) {
        await File.remove(realFilePath)
        this.emit('fileDeleted', { type: 'fileDeleted', file: filePath })
      }
    }

    return true
  }
}
