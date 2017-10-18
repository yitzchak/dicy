/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseBiberLog from '../../src/Rules/ParseBiberLog'
import { initializeRule } from '../helpers'

import type { ParsedLog } from '../../src/types'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = ParseBiberLog,
  parameters = [{
    filePath: 'BiberLog.blg'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, parameters, ...rest })
}

describe('ParseBiberLog', () => {
  it('verifies that all log messages are successfully parsed.', async (done) => {
    const logName = 'BiberLog.blg'
    const name = 'Biber'
    const { rule } = await initialize()
    const expectedParsedLog: ParsedLog = {
      calls: [],
      inputs: ['output/biber.bcf', 'BibTeXFile.bib'],
      outputs: ['output/biber.blg', 'output/biber.bbl'],
      messages: [{
        severity: 'info',
        name,
        text: 'This is Biber 2.7',
        log: { file: logName, range: { start: 1, end: 1 } }
      }, {
        severity: 'info',
        name,
        text: 'Logfile is \'output/biber.blg\'',
        log: { file: logName, range: { start: 2, end: 2 } }
      }, {
        severity: 'info',
        name,
        text: '=== Tue Feb 28, 2017, 09:36:09',
        log: { file: logName, range: { start: 3, end: 3 } }
      }, {
        severity: 'info',
        name,
        text: 'Reading \'output/biber.bcf\'',
        log: { file: logName, range: { start: 4, end: 4 } }
      }, {
        severity: 'info',
        name,
        text: 'Found 1 citekeys in bib section 0',
        log: { file: logName, range: { start: 5, end: 5 } }
      }, {
        severity: 'info',
        name,
        text: 'Processing section 0',
        log: { file: logName, range: { start: 6, end: 6 } }
      }, {
        severity: 'info',
        name,
        text: 'Looking for bibtex format file \'BibTeXFile.bib\' for section 0',
        log: { file: logName, range: { start: 7, end: 7 } }
      }, {
        severity: 'info',
        name,
        text: 'Decoding LaTeX character macros into UTF-8',
        log: { file: logName, range: { start: 8, end: 8 } }
      }, {
        severity: 'info',
        name,
        text: 'Found BibTeX data source \'BibTeXFile.bib\'',
        log: { file: logName, range: { start: 9, end: 9 } }
      }, {
        severity: 'info',
        name,
        text: 'Overriding locale \'en-US\' defaults \'normalization = NFD\' with \'normalization = prenormalized\'',
        log: { file: logName, range: { start: 10, end: 10 } }
      }, {
        severity: 'info',
        name,
        text: 'Overriding locale \'en-US\' defaults \'variable = shifted\' with \'variable = non-ignorable\'',
        log: { file: logName, range: { start: 11, end: 11 } }
      }, {
        severity: 'info',
        name,
        text: 'Sorting list \'nty/global/\' of type \'entry\' with scheme \'nty\' and locale \'en-US\'',
        log: { file: logName, range: { start: 12, end: 12 } }
      }, {
        severity: 'info',
        name,
        text: 'No sort tailoring available for locale \'en-US\'',
        log: { file: logName, range: { start: 13, end: 13 } }
      }, {
        severity: 'info',
        name,
        text: 'Writing \'output/biber.bbl\' with encoding \'ascii\'',
        log: { file: logName, range: { start: 14, end: 14 } }
      }, {
        severity: 'info',
        name,
        text: 'Output to output/biber.bbl',
        log: { file: logName, range: { start: 15, end: 15 } }
      }]
    }
    const parsedLogPath = 'BiberLog.blg-ParsedBiberLog'

    await rule.parse()

    const parsedLog: ?File = await rule.getFile(parsedLogPath)

    expect(parsedLog).toBeDefined()
    if (!parsedLog) return

    expect(parsedLog.value).toEqual(expectedParsedLog)

    done()
  })
})
