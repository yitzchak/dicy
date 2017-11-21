#! /usr/bin/env node

import Program from './Program'

const prog = new Program()
prog.start().catch(error => console.log(error))
