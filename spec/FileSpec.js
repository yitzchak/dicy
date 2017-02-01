/* @flow */

import 'babel-polyfill'
import path from 'path'

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

  it('verifies that physical files must exist to be created and is the right type', async (done) => {
    const file = await createFile('pkg-asymptote.tex')
    expect(file).toBeDefined()
    if (file) expect(file.type).toEqual('LaTeX')
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
})
