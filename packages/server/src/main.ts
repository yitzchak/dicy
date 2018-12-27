import { DiCy } from '@dicy/core'
import * as rpc from 'vscode-jsonrpc'
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

let transport: [rpc.MessageReader, rpc.MessageWriter] | undefined

if (argv.stdio) {
  transport = [new rpc.StreamMessageReader(process.stdin), new rpc.StreamMessageWriter(process.stdout)]
} else if (argv.nodeIpc) {
  transport = [new rpc.IPCMessageReader(process), new rpc.IPCMessageWriter(process)]
} else if (argv.port) {
  transport = rpc.createServerSocketTransport(argv.port as number)
} else if (argv.pipe) {
  transport = rpc.createServerPipeTransport(argv.pipe)
} else {
  yargs.showHelp()
}

if (transport) {
  const server: Server = new Server(transport, new DiCy())
  server.start()
}
