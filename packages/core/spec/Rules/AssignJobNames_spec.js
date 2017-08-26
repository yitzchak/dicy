/* @flow */

import 'babel-polyfill'
import path from 'path'

import State from '../../src/State'
import File from '../../src/File'
import AssignJobNames from '../../src/Rules/AssignJobNames'

describe('AssignJobNames', () => {
  const fixturesPath = path.resolve(__dirname, '..', 'fixtures')
  let state: State
  let source: File
  let assignJobNames: AssignJobNames

  beforeEach(async (done) => {
    state = await State.create(path.resolve(fixturesPath, 'file.tex'), [{
      name: 'filePath',
      type: 'string',
      description: 'file path',
      commands: []
    }])
    state.env.HOME = fixturesPath
    assignJobNames = new AssignJobNames(state, 'load', 'finalize', state.getJobOptions())
    source = await assignJobNames.getFile('file.tex')
    done()
  })

  describe('run', () => {
    it('verifies that no job names are set.', async (done) => {
      await assignJobNames.run()

      expect(Array.from(source.jobNames.values())).toEqual([])

      done()
    })

    it('verifies that job name is attached to file.', async (done) => {
      assignJobNames.options.jobName = 'foo'

      await assignJobNames.run()

      expect(Array.from(source.jobNames.values())).toEqual(['foo'])

      done()
    })
  })
})
