import * as dicy from '@dicy/core'
import * as rpc from 'vscode-jsonrpc'

export default class Server {
  cachedDiCy: Map<string, dicy.DiCy> = new Map<string, dicy.DiCy>()
  connection: any

  actionNotification = new rpc.NotificationType2<string, dicy.ActionEvent, void>('action')
  commandNotification = new rpc.NotificationType2<string, dicy.CommandEvent, void>('command')
  fileAddedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileAdded')
  fileChangedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileChanged')
  fileDeletedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileAdded')
  fileRemovedNotification = new rpc.NotificationType2<string, dicy.FileEvent, void>('fileRemoved')
  inputAddedNotification = new rpc.NotificationType2<string, dicy.InputOutputEvent, void>('inputAdded')
  logNotification = new rpc.NotificationType2<string, dicy.LogEvent, void>('log')
  outputAddedNotification = new rpc.NotificationType2<string, dicy.InputOutputEvent, void>('outputAdded')

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

    this.connection.onRequest(new rpc.RequestType1<string, boolean, void, void>('delete'),
      (filePath: string): Promise<void> => this.delete(filePath))

    this.connection.onNotification(new rpc.NotificationType0<void>('exit'), (): void => this.exit())

    this.connection.onRequest(new rpc.RequestType1<string, string[], void, void>('getTargetPaths'),
      async (filePath: string): Promise<string[]> => this.getTargetPaths(filePath))

    this.connection.onRequest(new rpc.RequestType1<string, boolean, void, void>('kill'),
      (filePath: string): Promise<void> => this.kill(filePath))

    this.connection.onRequest(new rpc.RequestType2<string, dicy.Command[], boolean, void, void>('run'),
      (filePath: string, commands: dicy.Command[]): Promise<boolean> => this.run(filePath, commands))

    this.connection.onRequest(new rpc.RequestType2<string, object, void, void, void>('setInstanceOptions'),
      async (filePath: string, options: object): Promise<void> => {
        await this.getDiCy(filePath, options)
      })

    this.connection.onRequest(new rpc.RequestType3<string, object, boolean | undefined, object, void, void>('updateOptions'),
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
