/* @flow */

import 'babel-polyfill'
import path from 'path'
import readdir from 'readdir-enhanced'

import { cloneFixtures } from './helpers'
import File from '../src/File'

describe('File', () => {
  let fixturesPath: string

  beforeEach(async (done) => {
    fixturesPath = await cloneFixtures()
    done()
  })

  function createFile (filePath: string): Promise<?File> {
    return File.create(path.join(fixturesPath, filePath), filePath)
  }

  it('verifies that virtual files can be created without a physical file existing and is the right type', async (done) => {
    const file = await createFile('foo.log-ParsedLaTeXLog')
    expect(file).toBeDefined()
    if (file) expect(file.type).toEqual('ParsedLaTeXLog')
    done()
  })

  it('verifies that physical files that do not exist will not be created', async (done) => {
    const file = await createFile('foo.tex')
    expect(file).toBeUndefined()
    done()
  })

  it('verifies that plain TeX files are not classified as LaTeX files', async (done) => {
    const file = await createFile('plain.tex')
    expect(file).toBeDefined()
    if (file) expect(file.type).toBeUndefined()
    done()
  })

  it('verifies that BibTeX control files are not classified as BibTeX files', async (done) => {
    const file = await createFile('wibble-blx.bib')
    expect(file).toBeDefined()
    if (file) expect(file.type).toEqual('BibTeXControlFile')
    done()
  })

  it('verifies that the detected file types are correct', async (done) => {
    const rootPath = path.join(fixturesPath, 'file-types')
    for (const fileName of await readdir.async(rootPath)) {
      const [, type, subType] = fileName.match(/^([^-._]+)(?:_([^-.]+))?/)
      const file = await createFile(path.join('file-types', fileName))
      expect(file).toBeDefined()
      if (file) {
        expect(file.type).toEqual(type)
        expect(file.subType).toEqual(subType)
      }
    }
    done()
  })
})
