import { EventEmitter } from 'events'
import * as cp from 'child_process'
import * as rpc from 'vscode-jsonrpc'
import { BuilderInterface, BuilderCacheInterface, Command, Message } from '@dicy/types'

class Builder extends EventEmitter implements BuilderInterface {
  cache: BuilderCacheInterface
  filePath: string
  logListener: (filePath: string, messages: Message[]) => void

  constructor (cache: BuilderCacheInterface, filePath: string) {
    super()
    this.cache = cache
    this.filePath = filePath
    this.logListener = (filePath: string, messages: Message[]): void => {
      if (filePath === this.filePath) this.emit('log', messages)
    }
    this.cache.on('log', this.logListener)
  }

  destroy () {
    this.cache.removeListener('log', this.logListener)
  }

  getTargetPaths (absolute?: boolean): Promise<string[]> {
    return this.cache.getTargetPaths(this.filePath, absolute)
  }

  kill (message?: string): Promise<void> {
    return this.cache.kill(this.filePath, message)
  }

  run (commands: Command[]): Promise<boolean> {
    return this.cache.run(this.filePath, commands)
  }

  setInstanceOptions (options: object, merge?: boolean): Promise<void> {
    return this.cache.setInstanceOptions(this.filePath, options, merge)
  }

  setUserOptions (options: object, merge?: boolean): Promise<void> {
    return this.cache.setUserOptions(this.filePath, options, merge)
  }

  setDirectoryOptions (options: object, merge?: boolean): Promise<void> {
    return this.cache.setDirectoryOptions(this.filePath, options, merge)
  }

  setProjectOptions (options: object, merge?: boolean): Promise<void> {
    return this.cache.setProjectOptions(this.filePath, options, merge)
  }
}

export default class Client extends EventEmitter implements BuilderCacheInterface {
  /** @internal */
  private autoStart: boolean
  /** @internal */
  private connection: any
  /** @internal */
  private server: cp.ChildProcess
  /** @internal */
  private cachedBuilders: Map<string, Builder> = new Map<string, Builder>()

  /** @internal */
  private clearRequest = new rpc.RequestType1<string, void, void, void>('clear')
  /** @internal */
  private clearAllRequest = new rpc.RequestType0<void, void, void>('clear')
  /** @internal */
  private exitNotification = new rpc.NotificationType0<void>('exit')
  /** @internal */
  private getTargetPathsRequest = new rpc.RequestType2<string, boolean | undefined, string[], void, void>('getTargetPaths')
  /** @internal */
  private killRequest = new rpc.RequestType2<string, string | undefined, void, void, void>('kill')
  /** @internal */
  private killAllRequest = new rpc.RequestType1<string | undefined, void, void, void>('killAll')
  /** @internal */
  private logNotification = new rpc.NotificationType2<string, Message[], void>('log')
  /** @internal */
  private runRequest = new rpc.RequestType2<string, Command[], boolean, void, void>('run')
  /** @internal */
  private setDirectoryOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions')
  /** @internal */
  private setInstanceOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setInstanceOptions')
  /** @internal */
  private setProjectOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setProjectOptions')
  /** @internal */
  private setUserOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setUserOptions')

  constructor (autoStart: boolean = false) {
    super()
    this.autoStart = autoStart
  }

  /** @internal */
  async bootstrap (): Promise<void> {
    if (this.autoStart && !this.server) await this.start()
  }

  async start (): Promise<void> {
    const serverPath = require.resolve('@dicy/server')

    this.server = cp.fork(serverPath, ['--node-ipc'])

    this.server.on('exit', () => {
      delete this.server
      delete this.connection
    })

    const input = new rpc.IPCMessageReader(this.server)
    const output = new rpc.IPCMessageWriter(this.server)

    this.connection = rpc.createMessageConnection(input, output)
    this.connection.onNotification(this.logNotification, (filePath: string, messages: Message[]): void => {
      this.emit('log', filePath, messages)
    })

    this.connection.listen()
  }

  exit (): void {
    try {
      this.connection.sendNotification(this.exitNotification)
    } finally {
      this.server.kill()
    }
  }

  async destroy (): Promise<void> {
    this.exit()
  }

  async get (filePath: string): Promise<BuilderInterface> {
    let builder: Builder | undefined = this.cachedBuilders.get(filePath)

    if (!builder) {
      builder = new Builder(this, filePath)
      this.cachedBuilders.set(filePath, builder)
    }

    return builder
  }

  async getTargetPaths (filePath: string, absolute?: boolean): Promise<string[]> {
    await this.bootstrap()
    return this.connection.sendRequest(this.getTargetPathsRequest, filePath, absolute)
  }

  async clear (filePath: string): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.clearRequest, filePath)
  }

  async clearAll (): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.clearAllRequest)
  }

  async kill (filePath: string, message?: string): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.killRequest, filePath, message)
  }

  async killAll (message?: string): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.killAllRequest, message)
  }

  async setInstanceOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setInstanceOptionsRequest, filePath, options, merge)
  }

  async setUserOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setUserOptionsRequest, filePath, options, merge)
  }

  async setDirectoryOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setDirectoryOptionsRequest, filePath, options, merge)
  }

  async setProjectOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setProjectOptionsRequest, filePath, options, merge)
  }

  async run (filePath: string, commands: Command[]): Promise<boolean> {
    await this.bootstrap()
    return this.connection.sendRequest(this.runRequest, filePath, commands)
  }
}
