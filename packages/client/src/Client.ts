import { EventEmitter } from 'events'
import * as cp from 'child_process'
import * as rpc from 'vscode-jsonrpc'
import {
  BuilderInterface, BuilderCacheInterface, Command, Message, OptionsSource, Uri
} from '@dicy/types'

class Builder extends EventEmitter implements BuilderInterface {
  cache: BuilderCacheInterface
  file: Uri
  logListener: (file: Uri, messages: Message[]) => void

  constructor (cache: BuilderCacheInterface, file: Uri) {
    super()
    this.cache = cache
    this.file = file
    this.logListener = (file: Uri, messages: Message[]): void => {
      if (file === this.file) this.emit('log', messages)
    }
    this.cache.on('log', this.logListener)
  }

  destroy () {
    this.cache.removeListener('log', this.logListener)
  }

  getTargets (): Promise<string[]> {
    return this.cache.getTargets(this.file)
  }

  kill (message?: string): Promise<void> {
    return this.cache.kill(this.file, message)
  }

  run (commands: Command[]): Promise<boolean> {
    return this.cache.run(this.file, commands)
  }

  setInstanceOptions (options: OptionsSource, merge?: boolean): Promise<void> {
    return this.cache.setInstanceOptions(this.file, options, merge)
  }

  setUserOptions (options: OptionsSource, merge?: boolean): Promise<void> {
    return this.cache.setUserOptions(this.file, options, merge)
  }

  setDirectoryOptions (options: OptionsSource, merge?: boolean): Promise<void> {
    return this.cache.setDirectoryOptions(this.file, options, merge)
  }

  setProjectOptions (options: OptionsSource, merge?: boolean): Promise<void> {
    return this.cache.setProjectOptions(this.file, options, merge)
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
  private clearRequest = new rpc.RequestType1<Uri, void, void, void>('clear')
  /** @internal */
  private clearAllRequest = new rpc.RequestType0<void, void, void>('clearAll')
  /** @internal */
  private getTargetsRequest = new rpc.RequestType1<Uri, string[], void, void>('getTargets')
  /** @internal */
  private exitNotification = new rpc.NotificationType0<void>('exit')
  /** @internal */
  private killRequest = new rpc.RequestType2<Uri, string | undefined, void, void, void>('kill')
  /** @internal */
  private killAllRequest = new rpc.RequestType1<string | undefined, void, void, void>('killAll')
  /** @internal */
  private logNotification = new rpc.NotificationType2<Uri, Message[], void>('log')
  /** @internal */
  private runRequest = new rpc.RequestType2<Uri, Command[], boolean, void, void>('run')
  /** @internal */
  private setDirectoryOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setDirectoryOptions')
  /** @internal */
  private setInstanceOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setInstanceOptions')
  /** @internal */
  private setProjectOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setProjectOptions')
  /** @internal */
  private setUserOptionsRequest = new rpc.RequestType3<Uri, OptionsSource, boolean | undefined, void, void, void>('setUserOptions')

  constructor (autoStart: boolean = false) {
    super()
    this.autoStart = autoStart
  }

  /** @internal */
  async bootstrap (): Promise<void> {
    if (this.autoStart && !this.server) await this.start()
  }

  createTransport (): [rpc.MessageReader, rpc.MessageWriter] {
    const serverPath = require.resolve('@dicy/server')

    this.server = cp.fork(serverPath, ['--node-ipc'])

    this.server.on('exit', () => {
      delete this.server
      delete this.connection
    })

    return [new rpc.IPCMessageReader(this.server), new rpc.IPCMessageWriter(this.server)]
  }

  async start (): Promise<void> {
    const transport: [rpc.MessageReader, rpc.MessageWriter] = this.createTransport()

    this.connection = rpc.createMessageConnection(transport[0], transport[1])
    this.connection.onNotification(this.logNotification, (file: Uri, messages: Message[]): void => {
      this.emit('log', file, messages)
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

  async get (file: Uri): Promise<BuilderInterface> {
    let builder: Builder | undefined = this.cachedBuilders.get(file)

    if (!builder) {
      builder = new Builder(this, file)
      this.cachedBuilders.set(file, builder)
    }

    return builder
  }

  async getTargets (file: Uri): Promise<string[]> {
    await this.bootstrap()
    return this.connection.sendRequest(this.getTargetsRequest, file)
  }

  async clear (file: Uri): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.clearRequest, file)
  }

  async clearAll (): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.clearAllRequest)
  }

  async kill (file: Uri, message?: string): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.killRequest, file, message)
  }

  async killAll (message?: string): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.killAllRequest, message)
  }

  async setInstanceOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setInstanceOptionsRequest, file, options, merge)
  }

  async setUserOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setUserOptionsRequest, file, options, merge)
  }

  async setDirectoryOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setDirectoryOptionsRequest, file, options, merge)
  }

  async setProjectOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setProjectOptionsRequest, file, options, merge)
  }

  async run (file: Uri, commands: Command[]): Promise<boolean> {
    await this.bootstrap()
    return this.connection.sendRequest(this.runRequest, file, commands)
  }
}
