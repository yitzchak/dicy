/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/@types/jasmine-expect/index.d.ts" />

import * as fs from 'fs-extra'
import * as path from 'path'

import File from '../../src/File'
import CreateOutputTree from '../../src/Rules/CreateOutputTree'
import { initializeRule, RuleDefinition } from '../helpers'

async function initialize ({ RuleClass = CreateOutputTree, ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, ...rest })
}

describe('CreateOutputTree', () => {
  describe('isApplicable', () => {
    it('returns false if outputDirectory is not set.', async (done) => {
      const { rule } = await initialize()

      expect(await CreateOutputTree.isApplicable(rule, 'build', 'initialize')).toBeFalse()

      done()
    })

    it('returns false if outputDirectory is set to current directory.', async (done) => {
      const { rule } = await initialize({
        options: { outputDirectory: '.' }
      })

      expect(await CreateOutputTree.isApplicable(rule, 'build', 'initialize')).toBeFalse()

      done()
    })

    it('returns true if outputDirectory is set.', async (done) => {
      const { rule } = await initialize({
        options: { outputDirectory: 'foo' }
      })

      expect(await CreateOutputTree.isApplicable(rule, 'build', 'initialize')).toBeTrue()

      done()
    })
  })

  describe('run', () => {
    let dirs
    let ensureDirSpy: jasmine.Spy

    function createTree (rule: CreateOutputTree) {
      dirs = ['foo/bar', 'quux/baz', 'wibble/angle/dangle'].map(dir => path.resolve(rule.rootPath, dir))
      return Promise.all(dirs.map(dir => fs.ensureDir(dir)))
    }

    beforeEach(async (done) => {
      ensureDirSpy = spyOn(File, 'ensureDir')
      done()
    })

    it('creates only directories not in the output directory', async (done) => {
      const { rule } = await initialize({
        clone: true,
        options: { outputDirectory: 'foo' }
      })
      const expectedDirectories = [
        'foo',
        'foo/quux',
        'foo/quux/baz',
        'foo/wibble',
        'foo/wibble/angle',
        'foo/wibble/angle/dangle'
      ].map(dir => [path.normalize(path.resolve(rule.rootPath, dir))])
      await createTree(rule)

      expect(await rule.run()).toBeTrue()
      expect(ensureDirSpy.calls.allArgs()).toEqual(jasmine.arrayWithExactContents(expectedDirectories))

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
        'foo',
        'foo/wibble',
        'foo/wibble/angle',
        'foo/wibble/angle/dangle'
      ].map(dir => [path.normalize(path.resolve(rule.rootPath, dir))])
      await createTree(rule)

      expect(await rule.run()).toBeTrue()
      expect(ensureDirSpy.calls.allArgs()).toEqual(jasmine.arrayWithExactContents(expectedDirectories))

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
        'foo',
        'foo/quux',
        'foo/quux/baz',
        'foo/wibble',
        'foo/wibble/angle',
        'foo/wibble/angle/dangle'
      ].map(dir => [path.normalize(path.resolve(rule.rootPath, dir))])
      await createTree(rule)

      expect(await rule.run()).toBeTrue()
      expect(ensureDirSpy.calls.allArgs()).toEqual(jasmine.arrayWithExactContents(expectedDirectories))

      done()
    })
  })
})
