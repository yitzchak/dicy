import { EventEmitter } from 'events'
import * as cp from 'child_process'
import * as rpc from 'vscode-jsonrpc'

export type Command = 'build' | 'clean' | 'graph' | 'load' | 'log' | 'save' | 'scrub'

export interface LineRange {
  start: number
  end: number
}

export interface Reference {
  file: string
  range?: LineRange
}

export declare type Severity = 'trace' | 'info' | 'warning' | 'error'

export interface Message {
  severity: Severity
  text: string
  name?: string
  category?: string
  source?: Reference
  log?: Reference
}

export interface LogEvent {
  type: 'log'
  messages: Message[]
}

export interface Option {
  name: string
  type: 'string' | 'strings' | 'number' | 'boolean' | 'variable'
  defaultValue?: any
  description: string
  values?: any[]
  aliases?: string[]
  commands?: string[]
  noInvalidate?: boolean
}

export class Client extends EventEmitter {
  private autoStart: boolean
  private connection: any
  private server: cp.ChildProcess

  private clearRequest = new rpc.RequestType1<string | undefined, boolean, void, void>('clear')
  private exitNotification = new rpc.NotificationType0<void>('exit')
  private getTargetPathsRequest = new rpc.RequestType2<string, boolean | undefined, string[], void, void>('getTargetPaths')
  private killRequest = new rpc.RequestType1<string | undefined, void, void, void>('kill')
  private logNotification = new rpc.NotificationType2<string, LogEvent, void>('log')
  private runRequest = new rpc.RequestType2<string, Command[], boolean, void, void>('run')
  private setDirectoryOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions')
  private setInstanceOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setInstanceOptions')
  private setProjectOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setProjectOptions')
  private setUserOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setUserOptions')

  constructor (autoStart: boolean = false) {
    super()
    this.autoStart = autoStart
  }

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
    this.connection.onNotification(this.logNotification, (filePath: string, event: LogEvent): void => {
      this.emit('log', filePath, event)
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

  async getTargetPaths (filePath: string, absolute?: boolean): Promise<string[]> {
    await this.bootstrap()
    return this.connection.sendRequest(this.getTargetPathsRequest, filePath, absolute)
  }

  async clear (filePath?: string): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.clearRequest, filePath)
  }

  async kill (filePath?: string): Promise<void> {
    await this.bootstrap()
    return this.connection.sendRequest(this.killRequest, filePath)
  }

  async setInstanceOptions (filePath: string, options: object, merge?: boolean): Promise<boolean> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setInstanceOptionsRequest, filePath, options, merge)
  }

  async setUserOptions (filePath: string, options: object, merge?: boolean): Promise<boolean> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setUserOptionsRequest, filePath, options, merge)
  }

  async setDirectoryOptions (filePath: string, options: object, merge?: boolean): Promise<boolean> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setDirectoryOptionsRequest, filePath, options, merge)
  }

  async setProjectOptions (filePath: string, options: object, merge?: boolean): Promise<boolean> {
    await this.bootstrap()
    return this.connection.sendRequest(this.setProjectOptionsRequest, filePath, options, merge)
  }

  async run (filePath: string, commands: Command[]): Promise<boolean> {
    await this.bootstrap()
    return this.connection.sendRequest(this.runRequest, filePath, commands)
  }
}
