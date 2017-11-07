import * as dicy from '@dicy/core'
import * as rpc from from 'vscode-jsonrpc'

export default class Server {
  cachedDiCy: Map<string, dicy.DiCy> = new Map<string, dicy.DiCy>()
  connection: any

  constructor (argv: object) {
    this.connection = rpc.createMessageConnection(
    	new rpc.StreamMessageReader(process.stdout),
    	new rpc.StreamMessageWriter(process.stdin))

    this.connection.onRequest(new rpc.RequestType2<string, dicy.Command[], boolean, void>('run'),
      (filePath: string, commands: dicy.Command[]): Promise<boolean> => this.run(filePath, commands))
  }

  start () {
    this.connection.listen()
  }

  async run (filePath: string, commands: dicy.Command[]): Promise<boolean> {
    return false
  }
}
