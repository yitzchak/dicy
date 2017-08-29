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
    const logName = 'error-warning.log'
    const { rule } = await initialize()
    const messages = [{
      name: 'pdfTeX',
      severity: 'info',
      text: 'expl3 2017/05/29 L3 programming layer (loader)',
      source: {
        file: sourceName
      },
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
      text: 'expl3 2017/05/29 L3 programming layer (code)',
      source: {
        file: sourceName
      },
      log: {
        file: logName,
        range: {
          start: 29,
          end: 29
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
          start: 177,
          end: 177
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
          start: 178,
          end: 178
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
      severity: 'error',
      name: 'pdfTeX',
      category: 'LaTeX',
      text: 'There\'s no line here to end',
      log: {
        file: logName,
        range: {
          start: 190,
          end: 190
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
          start: 202,
          end: 203
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
          start: 204,
          end: 205
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
          start: 206,
          end: 207
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
          start: 208,
          end: 209
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
          start: 210,
          end: 211
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      text: 'Argument of \\@sect has an extra }',
      log: {
        file: logName,
        range: {
          start: 212,
          end: 212
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
          start: 227,
          end: 227
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
          start: 236,
          end: 236
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
          start: 246,
          end: 246
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
          start: 257,
          end: 257
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
          start: 260,
          end: 260
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
          start: 262,
          end: 262
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
          start: 264,
          end: 264
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
          start: 275,
          end: 275
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
          start: 278,
          end: 278
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
          start: 280,
          end: 280
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      category: 'foo',
      source: {
        file: sourceName,
        range: {
          start: 47,
          end: 47
        }
      },
      text: '"bar"\nThe blind spot behind a submarine which makes a good hidding spot for other submarines.\nSee the foo documentation for further information.',
      log: {
        file: logName,
        range: {
          start: 282,
          end: 292
        }
      }
    }, {
      severity: 'warning',
      name: 'pdfTeX',
      category: 'foo',
      source: {
        file: sourceName,
        range: {
          start: 48,
          end: 48
        }
      },
      text: '"bar"\nThe blind spot behind a submarine which makes a good hidding spot for other submarines.',
      log: {
        file: logName,
        range: {
          start: 303,
          end: 308
        }
      }
    }, {
      severity: 'info',
      name: 'pdfTeX',
      category: 'foo',
      source: {
        file: sourceName,
        range: {
          start: 49,
          end: 49
        }
      },
      text: '"bar"\nThe blind spot behind a submarine which makes a good hidding spot for other submarines.',
      log: {
        file: logName,
        range: {
          start: 309,
          end: 314
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      category: 'LaTeX',
      text: 'File `sub/wibble.tex\' not found',
      source: {
        file: sourceName
      },
      log: {
        file: logName,
        range: {
          start: 318,
          end: 318
        }
      }
    }, {
      severity: 'error',
      name: 'pdfTeX',
      text: 'Emergency stop',
      log: {
        file: logName,
        range: {
          start: 324,
          end: 324
        }
      },
      source: {
        file: sourceName,
        range: {
          start: 54,
          end: 54
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

    expect(parsedLog.value.messages).toEqual(messages)

    done()
  })
})
