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

  it('verifies that virtual files can be created without a physical file existing and is the right type', async (done) => {
    const filePath = 'foo.log-ParsedLaTeXLog'
    const file = await File.create(path.join(fixturesPath, filePath), filePath)
    expect(file).toBeDefined()
    if (file) expect(file.type).toEqual('ParsedLaTeXLog')
    done()
  })

  it('verifies that physical files do not exist will not be created', async (done) => {
    const filePath = 'foo.tex'
    const file = await File.create(path.join(fixturesPath, filePath), filePath)
    expect(file).toBeUndefined()
    done()
  })

  it('verifies that physical files must exist to be created and is the right type', async (done) => {
    const filePath = 'pkg-asymptote.tex'
    const file = await File.create(path.join(fixturesPath, filePath), filePath)
    expect(file).toBeDefined()
    if (file) expect(file.type).toEqual('LaTeX')
    done()
  })

  it('verifies that plain TeX files are not classified as LaTeX files', async (done) => {
    const filePath = 'plain.tex'
    const file = await File.create(path.join(fixturesPath, filePath), filePath)
    expect(file).toBeDefined()
    if (file) expect(file.type).toBeUndefined()
    done()
  })
})
