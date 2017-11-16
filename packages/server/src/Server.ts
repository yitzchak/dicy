import * as dicy from '@dicy/core'
import * as rpc from 'vscode-jsonrpc'

export default class Server {
  private cache: dicy.BuilderCacheInterface = new dicy.DiCy()
  private connection: any

  private clearRequest = new rpc.RequestType1<string, void, void, void>('clear')
  private clearAllRequest = new rpc.RequestType0<void, void, void>('clear')
  private exitNotification = new rpc.NotificationType0<void>('exit')
  private getTargetPathsRequest = new rpc.RequestType2<string, boolean | undefined, string[], void, void>('getTargetPaths')
  private killRequest = new rpc.RequestType2<string, string | undefined, void, void, void>('kill')
  private killAllRequest = new rpc.RequestType1<string | undefined, void, void, void>('killAll')
  private logNotification = new rpc.NotificationType2<string, dicy.Message[], void>('log')
  private runRequest = new rpc.RequestType2<string, dicy.Command[], boolean, void, void>('run')
  private setDirectoryOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions')
  private setInstanceOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setInstanceOptions')
  private setProjectOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setProjectOptions')
  private setUserOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setUserOptions')

  constructor (argv: any) {
    let transport: [rpc.MessageReader, rpc.MessageWriter]

    if (argv.nodeIpc) {
      transport = [new rpc.IPCMessageReader(process), new rpc.IPCMessageWriter(process)]
    } else if (argv.port) {
      transport = rpc.createServerSocketTransport(argv.port)
    } else if (argv.pipe) {
      transport = rpc.createServerPipeTransport(argv.pipe)
    } else {
      transport = [new rpc.StreamMessageReader(process.stdout), new rpc.StreamMessageWriter(process.stdin)]
    }

    this.connection = rpc.createMessageConnection(transport[0], transport[1])

    this.connection.onRequest(this.clearRequest,
      (filePath: string): Promise<void> => this.cache.clear(filePath))

    this.connection.onRequest(this.clearAllRequest,
      (): Promise<void> => this.cache.clearAll())

    this.connection.onNotification(this.exitNotification,
      (): void => this.exit())

    this.connection.onRequest(this.getTargetPathsRequest,
      (filePath: string, absolute?: boolean): Promise<string[]> => this.cache.getTargetPaths(filePath, absolute))

    this.connection.onRequest(this.killRequest,
      (filePath: string, message?: string): Promise<void> => this.cache.kill(filePath, message))

    this.connection.onRequest(this.killAllRequest,
      (message?: string): Promise<void> => this.cache.killAll(message))

    this.connection.onRequest(this.runRequest,
      (filePath: string, commands: dicy.Command[]): Promise<boolean> => this.cache.run(filePath, commands))

    this.connection.onRequest(this.setInstanceOptionsRequest,
      (filePath: string, options: object, merge?: boolean): Promise<void> => this.cache.setInstanceOptions(filePath, options, merge))

    this.connection.onRequest(this.setUserOptionsRequest,
      (filePath: string, options: object, merge?: boolean): Promise<void> => this.cache.setUserOptions(filePath, options, merge))

    this.connection.onRequest(this.setDirectoryOptionsRequest,
      (filePath: string, options: object, merge?: boolean): Promise<void> => this.cache.setDirectoryOptions(filePath, options, merge))

    this.connection.onRequest(this.setProjectOptionsRequest,
      (filePath: string, options: object, merge?: boolean): Promise<void> => this.cache.setProjectOptions(filePath, options, merge))

    this.cache.on('log', (filePath: string, messages: dicy.Message): void => {
      this.connection.sendNotification(this.logNotification, filePath, messages)
    })
  }

  start () {
    this.connection.listen()
  }

  exit (): void {
    process.exit(0)
  }

  async destroy (): Promise<void> {
    await this.cache.destroy()
    this.exit()
  }
}
