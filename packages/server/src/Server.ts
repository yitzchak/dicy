import {
  BuilderCacheInterface, Command, Message, OptionsSource, Uri
} from '@dicy/core'
import * as rpc from 'vscode-jsonrpc'

export default class Server {
  private cache: BuilderCacheInterface
  private connection: any

  private clearRequest = new rpc.RequestType1<Uri, void, void, void>('clear')
  private clearAllRequest = new rpc.RequestType0<void, void, void>('clearAll')
  private exitNotification = new rpc.NotificationType0<void>('exit')
  private getTargetsRequest = new rpc.RequestType1<Uri, string[], void, void>('getTargets')
  private killRequest = new rpc.RequestType2<Uri, string | undefined, void, void, void>('kill')
  private killAllRequest = new rpc.RequestType1<string | undefined, void, void, void>('killAll')
  private logNotification = new rpc.NotificationType2<Uri, Message[], void>('log')
  private syncNotification = new rpc.NotificationType4<Uri, Uri, number, number, void>('sync')
  private runRequest = new rpc.RequestType2<Uri, Command[], boolean, void, void>('run')
  private setDirectoryOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setDirectoryOptions')
  private setInstanceOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setInstanceOptions')
  private setProjectOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setProjectOptions')
  private setUserOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setUserOptions')

  constructor (transport: [rpc.MessageReader, rpc.MessageWriter], cache: BuilderCacheInterface) {
    this.cache = cache

    this.connection = rpc.createMessageConnection(transport[0], transport[1])

    this.connection.onRequest(this.clearRequest,
      (file: Uri): Promise<void> => this.cache.clear(file))

    this.connection.onRequest(this.clearAllRequest,
      (): Promise<void> => this.cache.clearAll())

    this.connection.onNotification(this.exitNotification,
      (): void => this.exit())

    this.connection.onRequest(this.getTargetsRequest,
      (file: Uri, absolute?: boolean): Promise<string[]> => this.cache.getTargets(file))

    this.connection.onRequest(this.killRequest,
      (file: Uri, message?: string): Promise<void> => this.cache.kill(file, message))

    this.connection.onRequest(this.killAllRequest,
      (message?: string): Promise<void> => this.cache.killAll(message))

    this.connection.onRequest(this.runRequest,
      (file: Uri, commands: Command[]): Promise<boolean> => this.cache.run(file, commands))

    this.connection.onRequest(this.setInstanceOptionsRequest,
      (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> => this.cache.setInstanceOptions(file, options, merge))

    this.connection.onRequest(this.setUserOptionsRequest,
      (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> => this.cache.setUserOptions(file, options, merge))

    this.connection.onRequest(this.setDirectoryOptionsRequest,
      (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> => this.cache.setDirectoryOptions(file, options, merge))

    this.connection.onRequest(this.setProjectOptionsRequest,
      (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> => this.cache.setProjectOptions(file, options, merge))

    this.cache.on('log', (file: Uri, messages: Message): void => {
      this.connection.sendNotification(this.logNotification, file, messages)
    })

    this.cache.on('sync', (file: Uri, source: Uri, line: number, column: number): void => {
      this.connection.sendNotification(this.syncNotification, file, source, line, column)
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
