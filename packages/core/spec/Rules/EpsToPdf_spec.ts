/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/jasmine-expect/jasmine-matchers.d.ts" />

import EpsToPdf from '../../src/Rules/EpsToPdf'
import { initializeRule, RuleDefinition } from '../helpers'

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
  describe('isApplicable', () => {
    it('returns true if EPS file is the main source file.', async (done) => {
      const { rule } = await initialize({
        filePath: 'file-types/EncapsulatedPostScript.eps'
      })

      expect(await EpsToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if EPS file is not the main source file.', async (done) => {
      const { rule } = await initialize()

      expect(await EpsToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })

    it('returns true if there is a matching epstopdf call in the log.', async (done) => {
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
              options: { epstopdf: '' },
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      expect(await EpsToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeTrue()

      done()
    })

    it('returns false if there is a matching epstopdf call in the log.', async (done) => {
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
              options: { epstopdf: '' },
              status: 'executed (allowed)'
            }]
          }
        }]
      })

      expect(await EpsToPdf.isApplicable(rule, 'build', 'execute', rule.parameters)).toBeFalse()

      done()
    })
  })

  describe('getActions', () => {
    it('returns a run action for an EPS file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('EncapsulatedPostScript.eps')

      if (file) {
        const actions = rule.getActions(rule.firstParameter)
        expect(actions).toEqual(['run'])
      }

      done()
    })

    it('returns a no actions for a latex log file.', async (done) => {
      const { rule } = await initialize()
      const file = await rule.getFile('LaTeX.log-ParsedLaTeXLog')

      if (file) {
        const actions = rule.getActions(file)
        expect(actions).toBeEmptyArray()
      }

      done()
    })
  })

  describe('preEvaluate', () => {
    it('retains run action if no epstopdf calls present.', async (done) => {
      const { rule } = await initialize()

      rule.addActions(rule.firstParameter)
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBeTrue()

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

      rule.addActions(rule.firstParameter)
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBeFalse()

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

      rule.addActions(rule.firstParameter)
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBeTrue()

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

      rule.addActions(rule.firstParameter)
      await rule.preEvaluate()
      expect(rule.actions.has('run')).toBeTrue()

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
      expect(rule.options.epstopdfRestricted).toBeTrue()

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
        command: [
          'epstopdf',
          '--outfile={{$DIR_0/$NAME_0.pdf}}',
          '{{$FILEPATH_0}}'
        ],
        cd: '$ROOTDIR',
        severity: 'error',
        inputs: [{ file: '$FILEPATH_0', type: 'target' }],
        outputs: [{ file: '$DIR_0/$NAME_0.pdf', type: 'target' }]
      })

      done()
    })

    it('sets correct output path when epstopdfOutputPath is set.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfOutputPath: 'foo.pdf' }
      })

      expect(rule.constructCommand().command).toContain('--outfile={{foo.pdf}}')

      done()
    })

    it('add --hires to command line when epstopdfBoundingBox is set to hires.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfBoundingBox: 'hires' }
      })

      expect(rule.constructCommand().command).toContain('--hires')

      done()
    })

    it('add --exact to command line when epstopdfBoundingBox is set to exact.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfBoundingBox: 'exact' }
      })

      expect(rule.constructCommand().command).toContain('--exact')

      done()
    })

    it('add --restricted to command line when epstopdfRestricted is set.', async (done) => {
      const { rule } = await initialize({
        options: { epstopdfRestricted: true }
      })

      expect(rule.constructCommand().command).toContain('--restricted')

      done()
    })
  })
})
