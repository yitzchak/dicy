/* @flow */

import 'babel-polyfill'

import File from '../../src/File'
import ParseLaTeXLog from '../../src/Rules/ParseLaTeXLog'
import { initializeRule } from '../helpers'

import type { RuleDefinition } from '../helpers'

async function initialize ({
  RuleClass = ParseLaTeXLog,
  filePath = 'error-warning.tex',
  parameters = [{
    filePath: 'error-warning.log'
  }],
  ...rest }: RuleDefinition = {}) {
  return initializeRule({ RuleClass, filePath, parameters, ...rest })
}

describe('ParseLaTeXLog', () => {
  it('verifies that all log messages are successfully parsed.', async (done) => {
    const sourceName = 'error-warning.tex'
    const subSourceName = 'sub/wibble gronk.tex'
    const logName = 'error-warning.log'
    const { rule } = await initialize()
    const messages = [{
      name: 'pdfTeX',
      severity: 'info',
      text: 'expl3 2017/07/19 L3 programming layer (loader)',
      log: {
        file: logName,
        range: {
          start: 27,
          end: 27
        }
      }
    }, {
      name: 'pdfTeX',
      severity: 'info',
      text: 'expl3 2017/07/19 L3 programming layer (code)',
      log: {
        file: logName,
        range: {
          start: 29,
          end: 29
        }
      }
    }, {
      severity: 'warning',
      name: 'pdfTeX',
      text: 'No file error-warning.aux.',
      log: {
        file: 'error-warning.log',
        range: {
          start: 176,
          end: 176
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'Checking defaults for OML/cmm/m/it',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 179,
          end: 179
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: '... okay',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 180,
          end: 180
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'Checking defaults for T1/cmr/m/n',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 181,
          end: 181
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: '... okay',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 182,
          end: 182
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'Checking defaults for OT1/cmr/m/n',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 183,
          end: 183
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: '... okay',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 184,
          end: 184
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'Checking defaults for OMS/cmsy/m/n',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 185,
          end: 185
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: '... okay',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 186,
          end: 186
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'Checking defaults for OMX/cmex/m/n',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 187,
          end: 187
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: '... okay',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 188,
          end: 188
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'Checking defaults for U/cmr/m/n',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 189,
          end: 189
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: '... okay',
      source: {
        file: sourceName,
        range: {
          start: 5,
          end: 5
        }
      },
      log: {
        file: logName,
        range: {
          start: 190,
          end: 190
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      category: 'LaTeX',
      text: 'There\'s no line here to end',
      log: {
        file: logName,
        range: {
          start: 192,
          end: 192
        }
      },
      source: {
        file: sourceName,
        range: {
          start: 12,
          end: 12
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'External font `cmex10\' loaded for size <14.4>.',
      source: {
        file: sourceName,
        range: {
          start: 17,
          end: 17
        }
      },
      log: {
        file: logName,
        range: {
          start: 204,
          end: 205
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'External font `cmex10\' loaded for size <7>.',
      source: {
        file: sourceName,
        range: {
          start: 17,
          end: 17
        }
      },
      log: {
        file: logName,
        range: {
          start: 206,
          end: 207
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'External font `cmex10\' loaded for size <8>.',
      source: {
        file: sourceName,
        range: {
          start: 17,
          end: 17
        }
      },
      log: {
        file: logName,
        range: {
          start: 208,
          end: 209
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'External font `cmex10\' loaded for size <6>.',
      source: {
        file: sourceName,
        range: {
          start: 17,
          end: 17
        }
      },
      log: {
        file: logName,
        range: {
          start: 210,
          end: 211
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'LaTeX Font',
      text: 'External font `cmex10\' loaded for size <5>.',
      source: {
        file: sourceName,
        range: {
          start: 17,
          end: 17
        }
      },
      log: {
        file: logName,
        range: {
          start: 212,
          end: 213
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      text: 'Argument of \\@sect has an extra }',
      log: {
        file: logName,
        range: {
          start: 214,
          end: 214
        }
      },
      source: {
        file: sourceName,
        range: {
          start: 17,
          end: 17
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      text: 'Paragraph ended before \\@sect was complete',
      log: {
        file: logName,
        range: {
          start: 229,
          end: 229
        }
      },
      source: {
        file: sourceName,
        range: {
          start: 17,
          end: 17
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      text: 'Extra alignment tab has been changed to \\cr',
      log: {
        file: logName,
        range: {
          start: 238,
          end: 238
        }
      },
      source: {
        file: sourceName,
        range: {
          start: 26,
          end: 26
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      category: 'Class foo',
      text: 'Significant class issue',
      log: {
        file: logName,
        range: {
          start: 248,
          end: 248
        }
      },
      source: {
        file: sourceName,
        range: {
          start: 30,
          end: 30
        }
      }
    }, {
      severity: 'warning',
      name: 'pdfTeX',
      category: 'Class foo',
      text: 'Class issue',
      source: {
        file: sourceName,
        range: {
          start: 31,
          end: 31
        }
      },
      log: {
        file: logName,
        range: {
          start: 259,
          end: 259
        }
      }
    }, {
      severity: 'warning',
      name: 'pdfTeX',
      category: 'Class foo',
      text: 'Nebulous class issue.',
      source: {
        file: sourceName
      },
      log: {
        file: logName,
        range: {
          start: 262,
          end: 262
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'Class foo',
      text: 'Insignificant class issue',
      source: {
        file: sourceName,
        range: {
          start: 33,
          end: 33
        }
      },
      log: {
        file: logName,
        range: {
          start: 264,
          end: 264
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      category: 'Package bar',
      text: 'Significant package issue',
      log: {
        file: logName,
        range: {
          start: 266,
          end: 266
        }
      },
      source: {
        file: sourceName,
        range: {
          start: 36,
          end: 36
        }
      }
    }, {
      severity: 'warning',
      name: 'pdfTeX',
      category: 'Package bar',
      text: 'Package issue',
      source: {
        file: sourceName,
        range: {
          start: 37,
          end: 37
        }
      },
      log: {
        file: logName,
        range: {
          start: 277,
          end: 277
        }
      }
    }, {
      severity: 'warning',
      name: 'pdfTeX',
      category: 'Package bar',
      text: 'Nebulous package issue.',
      source: {
        file: sourceName
      },
      log: {
        file: logName,
        range: {
          start: 280,
          end: 280
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'Package bar',
      text: 'Insignificant package issue',
      source: {
        file: sourceName,
        range: {
          start: 39,
          end: 39
        }
      },
      log: {
        file: logName,
        range: {
          start: 282,
          end: 282
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      category: 'foo',
      source: {
        file: subSourceName,
        range: {
          start: 7,
          end: 7
        }
      },
      text: '"bar"\nThe blind spot behind a submarine which makes a good hidding spot for other submarines.\nSee the foo documentation for further information.',
      log: {
        file: logName,
        range: {
          start: 285,
          end: 295
        }
      }
    }, {
      severity: 'warning',
      name: 'pdfTeX',
      category: 'foo',
      source: {
        file: subSourceName,
        range: {
          start: 8,
          end: 8
        }
      },
      text: '"bar"\nThe blind spot behind a submarine which makes a good hidding spot for other submarines.',
      log: {
        file: logName,
        range: {
          start: 306,
          end: 311
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'foo',
      source: {
        file: subSourceName,
        range: {
          start: 9,
          end: 9
        }
      },
      text: '"bar"\nThe blind spot behind a submarine which makes a good hidding spot for other submarines.',
      log: {
        file: logName,
        range: {
          start: 312,
          end: 317
        }
      }
    }]
    const parsedLogPath = 'error-warning.log-ParsedLaTeXLog'

    await rule.parse()

    const parsedLog: ?File = await rule.getFile(parsedLogPath)

    expect(parsedLog).toBeDefined()
    if (!parsedLog) return

    expect(parsedLog.value).toBeDefined()
    if (!parsedLog.value) return

    expect(parsedLog.value.messages).toEqual(messages.map(jasmine.objectContaining))

    done()
  })
})
