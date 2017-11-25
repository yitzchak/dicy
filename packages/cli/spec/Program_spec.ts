import * as fs from 'fs-extra'
import * as path from 'path'
import { OptionDefinition } from '@dicy/core'

import Program from '../src/Program'

describe('Program', () => {
  let program: Program

  beforeEach(async (done) => {
    program = new Program()

    done()
  })

  describe('initializeLogs', () => {
    it('correctly initializes logs', async (done) => {
      const files = ['file:///foo/bar.tex', 'file://c:/quux/wibble.Rnw']

      program.initializeLogs(files)

      expect(program.logs.size).toEqual(2)
      files.forEach(file => expect(program.logs.get(file)).toEqual([]))

      done()
    })
  })

  describe('saveLogs', () => {
    it('correctly saves logs', async (done) => {
      spyOn(fs, 'writeFile')

      program.saveMessages('file:///foo/bar.tex', [])

      await program.saveLogs()

      expect(fs.writeFile).toHaveBeenCalledWith(path.normalize('/foo/bar-log.yaml'), '[]\n')

      done()
    })
  })

  describe('getOptions', () => {
    it('returns correct option definition for string option', () => {
      const definition: OptionDefinition = {
        name: 'foo',
        type: 'string',
        description: 'bar'
      }

      expect(program.getOptions(definition)).toEqual({
        foo: { type: 'string', alias: [], description: 'bar' }
      })
    })

    it('returns `choices` when values is present in definition', () => {
      const values = ['quux', 'wibble']
      const definition: OptionDefinition = {
        name: 'foo',
        type: 'string',
        description: 'bar',
        values
      }

      expect(program.getOptions(definition).foo.choices).toEqual(values)
    })

    it('returns correct aliases when present in definition', () => {
      const definition: OptionDefinition = {
        name: 'foo',
        type: 'string',
        description: 'bar',
        aliases: ['f', 'quux']
      }

      expect(program.getOptions(definition).foo.alias).toEqual(['f'])
    })

    it('returns option name from camel case name', () => {
      const definition: OptionDefinition = {
        name: 'foo2barQuux',
        type: 'string',
        description: 'bar'
      }

      expect(program.getOptions(definition)['foo2bar-quux']).toBeDefined()
    })

    it('returns correct option definition for strings option', () => {
      const definition: OptionDefinition = {
        name: 'foo',
        type: 'strings',
        description: 'bar'
      }

      expect(program.getOptions(definition)).toEqual({
        foo: { type: 'array', alias: [], description: 'bar' }
      })
    })

    it('returns correct option definition for number option', () => {
      const definition: OptionDefinition = {
        name: 'foo',
        type: 'number',
        description: 'bar'
      }

      expect(program.getOptions(definition)).toEqual({
        foo: { type: 'number', alias: [], description: 'bar' }
      })
    })

    it('returns correct option definition for boolean option', () => {
      const definition: OptionDefinition = {
        name: 'foo',
        type: 'boolean',
        description: 'Enable bar'
      }

      expect(program.getOptions(definition)).toEqual({
        foo: { type: 'boolean', alias: [], description: 'Enable bar' },
        'no-foo': { type: 'boolean', hidden: true }
      })
    })

    it('returns correct option definition for boolean option if default value is true', () => {
      const definition: OptionDefinition = {
        name: 'foo',
        type: 'boolean',
        defaultValue: true,
        description: 'Enable bar'
      }

      expect(program.getOptions(definition)).toEqual({
        foo: { type: 'boolean', hidden: true },
        'no-foo': { type: 'boolean', alias: [], description: 'Disable bar' }
      })
    })
  })
})
