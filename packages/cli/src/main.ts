#! /usr/bin/env node

import Program from './Program'

const prog = new Program(process.argv.slice(2))

process.on('SIGTERM', () => prog.destroy())
process.on('SIGINT', () => prog.destroy())

prog.start().catch(error => console.log(error))
