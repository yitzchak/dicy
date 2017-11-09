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

export declare type Severity = 'info' | 'warning' | 'error'

export interface Message {
  severity: Severity
  text: string
  name?: string
  category?: string
  source?: Reference
  log?: Reference
}

export interface LogEvent extends Message {
  type: 'log'
}

export interface ActionEvent {
  type: 'action'
  rule: string
  action: string
  triggers: string[]
}

export interface CommandEvent {
  type: 'command'
  rule: string
  command: string
}

export interface FileEvent {
  type: 'fileChanged' | 'fileAdded' | 'fileDeleted' | 'fileRemoved'
  file: string
  virtual?: boolean
}

export interface InputOutputEvent {
  type: 'inputAdded' | 'outputAdded'
  rule: string
  file: string
  virtual?: boolean
}

export type Event = LogEvent | ActionEvent | CommandEvent | FileEvent | InputOutputEvent

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

export class Client {
  private server: cp.ChildProcess
  private connection: any

  private actionNotification = new rpc.NotificationType2<string, ActionEvent, void>('action')
  private clearRequest = new rpc.RequestType1<string | undefined, boolean, void, void>('clear')
  private commandNotification = new rpc.NotificationType2<string, CommandEvent, void>('command')
  private exitNotification = new rpc.NotificationType0<void>('exit')
  private fileAddedNotification = new rpc.NotificationType2<string, FileEvent, void>('fileAdded')
  private fileChangedNotification = new rpc.NotificationType2<string, FileEvent, void>('fileChanged')
  private fileDeletedNotification = new rpc.NotificationType2<string, FileEvent, void>('fileDeleted')
  private fileRemovedNotification = new rpc.NotificationType2<string, FileEvent, void>('fileRemoved')
  private getTargetPathsRequest = new rpc.RequestType2<string, boolean, string[], void, void>('getTargetPaths')
  private inputAddedNotification = new rpc.NotificationType2<string, InputOutputEvent, void>('inputAdded')
  private killRequest = new rpc.RequestType1<string | undefined, void, void, void>('kill')
  private logNotification = new rpc.NotificationType2<string, LogEvent, void>('log')
  private outputAddedNotification = new rpc.NotificationType2<string, InputOutputEvent, void>('outputAdded')
  private runRequest = new rpc.RequestType2<string, Command[], boolean, void, void>('run')
  private setInstanceOptionsRequest = new rpc.RequestType2<string, object, void, void, void>('setInstanceOptions')
  private updateOptionsRequest = new rpc.RequestType3<string, object, boolean | undefined, object, void, void>('updateOptions')

  async start (): Promise<void> {
    const serverPath = require.resolve('@dicy/server')

    this.server = cp.fork(serverPath, ['--node-ipc'])

    const input = new rpc.IPCMessageReader(this.server)
    const output = new rpc.IPCMessageWriter(this.server)

    this.connection = rpc.createMessageConnection(input, output)

    this.connection.listen()
  }

  exit (): void {
    this.connection.sendNotification(this.exitNotification)
  }

  getTargetPaths (filePath: string, absolute: boolean = false): Promise<string[]> {
    return this.connection.sendRequest(this.getTargetPathsRequest, filePath, absolute)
  }

  clear (filePath?: string): Promise<void> {
    return this.connection.sendRequest(this.clearRequest, filePath)
  }

  kill (filePath?: string): Promise<void> {
    return this.connection.sendRequest(this.killRequest, filePath)
  }

  setInstanceOptions (filePath: string, options: object): Promise<boolean> {
    return this.connection.sendRequest(this.setInstanceOptionsRequest, filePath, options)
  }

  run (filePath: string, commands: Command[]): Promise<boolean> {
    return this.connection.sendRequest(this.runRequest, filePath, commands)
  }

  updateOptions (filePath: string, options: object, user?: boolean): Promise<object> {
    return this.connection.sendRequest(this.updateOptionsRequest, filePath, options, user)
  }

  onAction (handler: (filePath: string, event: ActionEvent) => void): void {
    this.connection.onNotification(this.actionNotification, handler)
  }

  onCommand (handler: (filePath: string, event: CommandEvent) => void): void {
    this.connection.onNotification(this.commandNotification, handler)
  }

  onFileAdded (handler: (filePath: string, event: FileEvent) => void): void {
    this.connection.onNotification(this.fileAddedNotification, handler)
  }

  onFileChanged (handler: (filePath: string, event: FileEvent) => void): void {
    this.connection.onNotification(this.fileChangedNotification, handler)
  }

  onFileDeleted (handler: (filePath: string, event: CommandEvent) => void): void {
    this.connection.onNotification(this.fileDeletedNotification, handler)
  }

  onFileRemoved (handler: (filePath: string, event: FileEvent) => void): void {
    this.connection.onNotification(this.fileRemovedNotification, handler)
  }

  onInputAdded (handler: (filePath: string, event: InputOutputEvent) => void): void {
    this.connection.onNotification(this.inputAddedNotification, handler)
  }

  onLog (handler: (filePath: string, event: LogEvent) => void): void {
    this.connection.onNotification(this.logNotification, handler)
  }

  onOutputAdded (handler: (filePath: string, event: InputOutputEvent) => void): void {
    this.connection.onNotification(this.outputAddedNotification, handler)
  }
}