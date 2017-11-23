import * as fs from 'fs-extra'
import * as path from 'path'

import Program from '../src/Program'

describe('Program', () => {
  let program: Program

  beforeEach(async (done) => {
    program = new Program()

    done()
  })

  it('correctly initializes logs', async (done) => {
    const files = ['file:///foo/bar.tex', 'file://c:/quux/wibble.Rnw']

    program.initializeLogs(files)

    expect(program.logs.size).toEqual(2)
    files.forEach(file => expect(program.logs.get(file)).toEqual([]))

    done()
  })

  it('correctly saves logs', async (done) => {
    spyOn(fs, 'writeFile')

    program.saveMessages('file:///foo/bar.tex', [])

    await program.saveLogs()

    expect(fs.writeFile).toHaveBeenCalledWith(path.normalize('/foo/bar-log.yaml'), '[]\n')

    done()
  })
})
