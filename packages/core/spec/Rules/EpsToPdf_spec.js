/* @flow */

import 'babel-polyfill'

import EpsToPdf from '../../src/Rules/EpsToPdf'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = EpsToPdf,
  parameters = [{
    filePath: 'EncapsulatedPostScript.eps'
  }, {
    filePath: 'x.y-Nil'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('EpsToPdf', () => {
  describe('appliesToParameters', () => {
    it('returns true if EPS file is the main source file.', async (done) => {
      const { rule, options } = await initialize({
        filePath: 'file-types/EncapsulatedPostScript.eps'
      })

      expect(await EpsToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if EPS file is not the main source file.', async (done) => {
      const { rule, options } = await initialize()

      expect(await EpsToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })

    it('returns true if there is a matching epstopdf call in the log.', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'EncapsulatedPostScript.eps'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['epstopdf', 'EncapsulatedPostScript.eps'],
              options: { epstopdf: '' },
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      expect(await EpsToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(true)

      done()
    })

    it('returns false if there is a matching epstopdf call in the log.', async (done) => {
      const { rule, options } = await initialize({
        parameters: [{
          filePath: 'EncapsulatedPostScript.eps'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['epstopdf', 'foo.eps'],
              options: { epstopdf: '' },
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      expect(await EpsToPdf.appliesToParameters(rule.state, 'build', 'execute', options, ...rule.parameters)).toBe(false)

      done()
    })
  })

  describe('getFileActions', () => {
    it('returns a run action for an EPS file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('EncapsulatedPostScript.eps')

      if (file) {
        const actions = await rule.getFileActions(rule.firstParameter)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a no actions for a latex log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        const actions = await rule.getFileActions(file)
        expect(actions).toEqual([])
      }

      done()
    })
  })

  describe('preEvaluate', () => {
    it('retains run action if no epstopdf calls present.', async (done) => {
      const { rule } = await initialize()

      rule.addActions()
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBe(true)

      done()
    })

    it('removes run action if epstopdf call present.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'EncapsulatedPostScript.eps'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['epstopdf', 'EncapsulatedPostScript.eps'],
              options: {},
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      rule.addActions()
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBe(false)

      done()
    })

    it('retains run action if epstopdf call failed.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'EncapsulatedPostScript.eps'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['epstopdf', 'EncapsulatedPostScript.eps'],
              options: {},
              status: 'clobbered'
            }]
          }
        }]
      })

      rule.addActions()
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBe(true)

      done()
    })

    it('retains run action if epstopdf call was for another file.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'EncapsulatedPostScript.eps'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['epstopdf', 'foo.eps'],
              options: {},
              status: 'execute (allowed)'
            }]
          }
        }]
      })

      rule.addActions()
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBe(true)

      done()
    })
  })

  describe('initialize', () => {
    it('verifies that epstopdf call overrides default options.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'EncapsulatedPostScript.eps'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['epstopdf', 'EncapsulatedPostScript.eps'],
              options: {
                hires: true,
                outfile: 'foo.pdf',
                restricted: true
              },
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      expect(rule.options.epstopdfBoundingBox).toBe('hires')
      expect(rule.options.epstopdfOutputPath).toBe('foo.pdf')
      expect(rule.options.epstopdfRestricted).toBe(true)

      done()
    })

    it('verifies that epstopdf with --exact call overrides default options.', async (done) => {
      const { rule } = await initialize({
        parameters: [{
          filePath: 'EncapsulatedPostScript.eps'
        }, {
          filePath: 'LaTeX.log-ParsedLaTeXLog',
          value: {
            inputs: [],
            outputs: [],
            messages: [],
            calls: [{
              args: ['epstopdf', 'EncapsulatedPostScript.eps'],
              options: {
                exact: true
              },
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      expect(rule.options.epstopdfBoundingBox).toBe('exact')

      done()
    })
  })

  describe('constructCommand', () => {
    it('returns correct arguments and command options for index file.', async (done) => {
      const { rule } = await initialize()

      expect(rule.constructCommand()).toEqual({
        args: [
          'epstopdf',
          '--outfile={{$DIR_0/$NAME_0.pdf}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        outputs: ['$DIR_0/$NAME_0.pdf']
      })

      done()
    })

    it('sets correct output path when epstopdfOutputPath is set.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfOutputPath: 'foo.pdf' }
      })

      expect(rule.constructCommand().args).toContain('--outfile={{foo.pdf}}')

      done()
    })

    it('add --hires to command line when epstopdfBoundingBox is set to hires.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfBoundingBox: 'hires' }
      })

      expect(rule.constructCommand().args).toContain('--hires')

      done()
    })

    it('add --exact to command line when epstopdfBoundingBox is set to exact.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfBoundingBox: 'exact' }
      })

      expect(rule.constructCommand().args).toContain('--exact')

      done()
    })

    it('add --restricted to command line when epstopdfRestricted is set.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfRestricted: true }
      })

      expect(rule.constructCommand().args).toContain('--restricted')

      done()
    })
  })
})
