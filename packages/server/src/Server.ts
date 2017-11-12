import * as dicy from '@dicy/core'
import * as rpc from 'vscode-jsonrpc'

export default class Server {
  private cachedDiCy: Map<string, dicy.DiCy> = new Map<string, dicy.DiCy>()
  private connection: any

  private clearRequest = new rpc.RequestType1<string | undefined, boolean, void, void>('clear')
  private exitNotification = new rpc.NotificationType0<void>('exit')
  private getTargetPathsRequest = new rpc.RequestType2<string, boolean | undefined, string[], void, void>('getTargetPaths')
  private killRequest = new rpc.RequestType1<string | undefined, void, void, void>('kill')
  private logNotification = new rpc.NotificationType2<string, dicy.LogEvent, void>('log')
  private runRequest = new rpc.RequestType2<string, dicy.Command[], boolean, void, void>('run')
  private setInstanceOptionsRequest = new rpc.RequestType2<string, object, void, void, void>('setInstanceOptions')
  private updateOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, object, void, void>('updateOptions')

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
      (filePath?: string): Promise<void> => this.clear(filePath))

    this.connection.onNotification(this.exitNotification,
      (): void => this.exit())

    this.connection.onRequest(this.getTargetPathsRequest,
      async (filePath: string): Promise<string[]> => this.getTargetPaths(filePath))

    this.connection.onRequest(this.killRequest,
      (filePath?: string): Promise<void> => this.kill(filePath))

    this.connection.onRequest(this.runRequest,
      (filePath: string, commands: dicy.Command[]): Promise<boolean> => this.run(filePath, commands))

    this.connection.onRequest(this.setInstanceOptionsRequest,
      async (filePath: string, options: object): Promise<void> => {
        await this.getDiCy(filePath, options)
      })

    this.connection.onRequest(this.updateOptionsRequest,
      async (filePath: string, options: object, user?: boolean): Promise<object> => this.updateOptions(filePath, options, user))
  }

  start () {
    this.connection.listen()
  }

  async getDiCy (filePath: string, options?: object): Promise<dicy.DiCy> {
    let builder: dicy.DiCy | undefined = this.cachedDiCy.get(filePath)

    if (builder) {
      if (options) await builder.setInstanceOptions(options)
    } else {
      builder = await dicy.DiCy.create(filePath, options)
      this.cachedDiCy.set(filePath, builder)
      builder.on('log', (event: dicy.LogEvent) =>
        this.connection.sendNotification(this.logNotification, filePath, event))
    }

    return builder
  }

  exit (): void {
    process.exit(0)
  }

  async getTargetPaths (filePath: string, absolute: boolean = true): Promise<string[]> {
    const builder: dicy.DiCy = await this.getDiCy(filePath)
    return builder.getTargetPaths(absolute)
  }

  async clear (filePath?: string): Promise<void> {
    if (filePath) {
      const builder: dicy.DiCy | undefined = this.cachedDiCy.get(filePath)

      if (builder) {
        builder.removeAllListeners()
        this.cachedDiCy.delete(filePath)
      }
    } else {
      for (const builder of this.cachedDiCy.values()) {
        builder.removeAllListeners()
      }
      this.cachedDiCy.clear()
    }
  }

  async kill (filePath?: string): Promise<void> {
    if (filePath) {
      const builder: dicy.DiCy = await this.getDiCy(filePath)
      await builder.kill()
    } else {
      const killJobs = Array.from(this.cachedDiCy.values()).map(builder => builder.kill())
      await Promise.all(killJobs)
    }
  }

  async run (filePath: string, commands: dicy.Command[]): Promise<boolean> {
    const builder: dicy.DiCy = await this.getDiCy(filePath)
    return builder.run(...commands)
  }

  async updateOptions (filePath: string, options: object, user?: boolean): Promise<object> {
    const builder: dicy.DiCy = await this.getDiCy(filePath)
    return builder.updateOptions(options, user)
  }
}
