/* @flow */

import 'babel-polyfill'
import fs from 'fs-extra'
import path from 'path'

import File from '../../src/File'
import CreateOutputTree from '../../src/Rules/CreateOutputTree'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({ RuleClass = CreateOutputTree, ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, ...rest })
}

describe('CreateOutputTree', () => {
  describe('isApplicable', () => {
    it('returns false if outputDirectory is not set.', async (done) => {
      const { rule, options } = await initialize()

      expect(await CreateOutputTree.isApplicable(rule.state, 'build', 'initialize', options)).toBe(false)

      done()
    })

    it('returns false if outputDirectory is set to current directory.', async (done) => {
      const { rule, options } = await initialize({
        options: { outputDirectory: '.' }
      })

      expect(await CreateOutputTree.isApplicable(rule.state, 'build', 'initialize', options)).toBe(false)

      done()
    })

    it('returns true if outputDirectory is set.', async (done) => {
      const { rule, options } = await initialize({
        options: { outputDirectory: 'foo' }
      })

      expect(await CreateOutputTree.isApplicable(rule.state, 'build', 'initialize', options)).toBe(true)

      done()
    })
  })

  describe('run', () => {
    let tempDir
    let dirs

    function createTree (rule) {
      dirs = ['foo/bar', 'quux/baz', 'wibble/angle/dangle'].map(dir => path.resolve(rule.rootPath, dir))
      return Promise.all(dirs.map(dir => fs.ensureDir(dir)))
    }

    beforeEach(async (done) => {
      spyOn(File, 'ensureDir')
      done()
    })

    it('creates only directories not in the output directory', async (done) => {
      const { rule } = await initialize({
        clone: true,
        options: { outputDirectory: 'foo' }
      })
      const expectedDirectories = [
        'foo/quux',
        'foo/quux/baz',
        'foo/wibble',
        'foo/wibble/angle',
        'foo/wibble/angle/dangle'
      ].map(dir => [path.resolve(rule.rootPath, dir)])
      await createTree(rule)

      expect(await rule.run()).toBeTruthy()
      expect(File.ensureDir.calls.allArgs()).toEqual(jasmine.arrayWithExactContents(expectedDirectories))

      done()
    })

    it('creates only directories not in any output directory', async (done) => {
      const { rule } = await initialize({
        clone: true,
        jobName: 'job1',
        options: {
          jobs: {
            job1: { outputDirectory: 'foo' },
            job2: { outputDirectory: 'quux' }
          }
        }
      })
      const expectedDirectories = [
        'foo/wibble',
        'foo/wibble/angle',
        'foo/wibble/angle/dangle'
      ].map(dir => [path.resolve(rule.rootPath, dir)])
      await createTree(rule)

      expect(await rule.run()).toBeTruthy()
      expect(File.ensureDir.calls.allArgs()).toEqual(jasmine.arrayWithExactContents(expectedDirectories))

      done()
    })

    it('creates only directories not in any output directory ignoring jobs that have no output directory', async (done) => {
      const { rule } = await initialize({
        clone: true,
        jobName: 'job1',
        options: {
          jobs: {
            job1: { outputDirectory: 'foo' },
            job2: { }
          }
        }
      })
      const expectedDirectories = [
        'foo/quux',
        'foo/quux/baz',
        'foo/wibble',
        'foo/wibble/angle',
        'foo/wibble/angle/dangle'
      ].map(dir => [path.resolve(rule.rootPath, dir)])
      await createTree(rule)

      expect(await rule.run()).toBeTruthy()
      expect(File.ensureDir.calls.allArgs()).toEqual(jasmine.arrayWithExactContents(expectedDirectories))

      done()
    })
  })
})
