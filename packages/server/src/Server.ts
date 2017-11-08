import * as dicy from '@dicy/core'
import * as rpc from 'vscode-jsonrpc'

export default class Server {
  private cachedDiCy: Map<string, dicy.DiCy> = new Map<string, dicy.DiCy>()
  private connection: any

  private actionNotification = new rpc.NotificationType2<string, dicy.ActionEvent, void>('action')
  private commandNotification = new rpc.NotificationType2<string, dicy.CommandEvent, void>('command')
  private deleteRequest = new rpc.RequestType1<string, boolean, void, void>('delete')
  private exitNotification = new rpc.NotificationType0<void>('exit')
  private fileAddedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileAdded')
  private fileChangedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileChanged')
  private fileDeletedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileAdded')
  private fileRemovedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileRemoved')
  private getTargetPathsRequest = new rpc.RequestType1<string, string[], void, void>('getTargetPaths')
  private inputAddedNotification = new rpc.NotificationType2<string, dicy.InputOutputEvent, void>('inputAdded')
  private killRequest = new rpc.RequestType1<string, boolean, void, void>('kill')
  private logNotification = new rpc.NotificationType2<string, dicy.LogEvent, void>('log')
  private outputAddedNotification = new rpc.NotificationType2<string, dicy.InputOutputEvent, void>('outputAdded')
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

    this.connection.onRequest(this.deleteRequest,
      (filePath: string): Promise<void> => this.delete(filePath))

    this.connection.onNotification(this.exitNotification,
      (): void => this.exit())

    this.connection.onRequest(this.getTargetPathsRequest,
      async (filePath: string): Promise<string[]> => this.getTargetPaths(filePath))

    this.connection.onRequest(this.killRequest,
      (filePath: string): Promise<void> => this.kill(filePath))

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
      builder
        .on('action', (event: dicy.ActionEvent) => this.connection.sendNotification(this.actionNotification, filePath, event))
        .on('command', (event: dicy.CommandEvent) => this.connection.sendNotification(this.commandNotification, filePath, event))
        .on('fileAdded', (event: dicy.FileEvent) => this.connection.sendNotification(this.fileAddedNotification, filePath, event))
        .on('fileChanged', (event: dicy.FileEvent) => this.connection.sendNotification(this.fileChangedNotification, filePath, event))
        .on('fileDeleted', (event: dicy.FileEvent) => this.connection.sendNotification(this.fileDeletedNotification, filePath, event))
        .on('fileRemoved', (event: dicy.FileEvent) => this.connection.sendNotification(this.fileRemovedNotification, filePath, event))
        .on('inputAdded', (event: dicy.InputOutputEvent) => this.connection.sendNotification(this.inputAddedNotification, filePath, event))
        .on('log', (event: dicy.LogEvent) => this.connection.sendNotification(this.logNotification, filePath, event))
        .on('ouputAdded', (event: dicy.InputOutputEvent) => this.connection.sendNotification(this.outputAddedNotification, filePath, event))
    }

    return builder
  }

  exit (): void {
    process.exit(0)
  }

  async getTargetPaths (filePath: string): Promise<string[]> {
    let builder: dicy.DiCy = await this.getDiCy(filePath)

    return builder.getTargetPaths()
  }

  async delete (filePath: string): Promise<void> {
    let builder: dicy.DiCy | undefined = this.cachedDiCy.get(filePath)

    if (builder) {
      builder.removeAllListeners()
      this.cachedDiCy.delete(filePath)
    }
  }

  async kill (filePath: string): Promise<void> {
    let builder: dicy.DiCy = await this.getDiCy(filePath)

    return builder.kill()
  }

  async run (filePath: string, commands: dicy.Command[]): Promise<boolean> {
    let builder: dicy.DiCy = await this.getDiCy(filePath)

    return builder.run(...commands)
  }

  async updateOptions (filePath: string, options: object, user?: boolean): Promise<object> {
    let builder: dicy.DiCy = await this.getDiCy(filePath)

    return builder.updateOptions(options, user)
  }
}
