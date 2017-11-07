#! /usr/bin/env node
import * as yargs from 'yargs'
import Server from './Server'

const argv = yargs
  .usage(`JSON-RPC server for DiCy
  Usage: dicy-server --node-ipc
     or: dicy-server --pipe=<name>
     or: dicy-server --socket=<port>
     or: dicy-server --stdio`)
  .option('node-ipc', {
    conflicts: ['socket', 'stdio', 'pipe'],
    describe: 'use node-ipc',
    default: undefined,
    type: 'boolean'
  })
  .option('pipe', {
    conflicts: ['nodeIpc', 'stdio', 'socket'],
    describe: 'use named pipe. example: --pipe=foo',
    type: 'string'
  })
  .option('socket', {
    conflicts: ['nodeIpc', 'stdio', 'pipe'],
    describe: 'use socket. example: --socket=5000',
    type: 'number'
  })
  .option('stdio', {
    conflicts: ['socket', 'nodeIpc', 'pipe'],
    describe: 'use stdio',
    default: undefined,
    type: 'boolean'
  })
  .help()
  .argv

if (argv.stdio || argv.nodeIpc || argv.socket || argv.pipe) {
  const server: Server = new Server(argv)
  server.start()
} else {
  yargs.showHelp()
}
