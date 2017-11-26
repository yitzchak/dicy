#!/usr/bin/env node

import Program from './Program'

const prog = new Program(process.argv.slice(2))

process.on('SIGTERM', () => prog.destroy())
process.on('SIGINT', () => prog.destroy())

prog.start().then(
  success => process.exit(success ? 0 : 1),
  reason => {
    console.log(reason.toString())
    process.exit(70)
  })
