import { Command } from '@dicy/types'
import * as url from 'url'
import * as path from 'path'

import { default as DBus, DBusSignalEmitter } from '../DBus'
import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Group, Phase } from '../types'

export interface DBusNames {
  applicationObject: string,
  applicationInterface: string,

  daemonService: string,
  daemonObject: string,
  daemonInterface: string,

  windowInterface: string,

  fdApplicationObject?: string,
  fdApplicationInterface?: string
}

interface EvinceDaemon extends DBusSignalEmitter {
  RegisterDocument (uri: string): Promise<string>
  UnregisterDocument (uri: string): Promise<void>
  FindDocument (uri: string, spawn: boolean): Promise<string>
}

interface EvinceApplication extends DBusSignalEmitter {
  Reload (args: { [ name: string ]: any }, timestamp: number): Promise<void>
  GetWindowList (): Promise<string[]>
}

interface EvinceWindow extends DBusSignalEmitter {
  SyncView (sourceFile: string, sourcePoint: [number, number], timestamp: number): Promise<void>
  on (signal: 'SyncSource', callback: (sourceFile: string, sourcePoint: [number, number], timestamp: number) => void): void
  on (signal: 'Closed', callback: () => void): void
  on (signal: 'DocumentLoaded', callback: (uri: string) => void): void
}

interface FreeDesktopApplication extends DBusSignalEmitter {
  Activate (platformData: { [ name: string ]: any }): Promise<void>
  ActivateAction (actionName: string, parameter: string[], platformData: { [ name: string ]: any }): Promise<void>
  Open (uris: string[], platformData: { [ name: string ]: any }): Promise<void>
}

interface WindowInstance {
  evinceWindow: EvinceWindow
  onClosed: () => void,
  onSyncSource: (uri: string, point: [number, number]) => void,
  fdApplication?: FreeDesktopApplication
}

export default class Evince extends Rule {
  static commands: Set<Command> = new Set<Command>(['open'])
  static parameterTypes: Set<string>[] = [new Set(['DeviceIndependentFile', 'PortableDocumentFormat', 'PostScript'])]
  static alwaysEvaluate: boolean = true
  static description: string = 'Open targets using evince.'

  static dbusNames: DBusNames = {
    applicationObject: '/org/gnome/evince/Evince',
    applicationInterface: 'org.gnome.evince.Application',

    daemonService: 'org.gnome.evince.Daemon',
    daemonObject: '/org/gnome/evince/Daemon',
    daemonInterface: 'org.gnome.evince.Daemon',

    windowInterface: 'org.gnome.evince.Window',

    fdApplicationObject: '/org/gtk/Application/anonymous',
    fdApplicationInterface: 'org.freedesktop.Application'
  }
  static bus: DBus = new DBus()
  static daemon: EvinceDaemon

  windowInstance?: WindowInstance

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    return await this.initializeDaemon() && consumer.isOutputTarget(parameters[0])
  }

  static async initializeDaemon (): Promise<boolean> {
    if (this.daemon) {
      return true
    }

    /* tslint:disable:no-empty */
    try {
      if (this.bus.connected) {
        this.daemon = await this.bus.getInterface(this.dbusNames.daemonService, this.dbusNames.daemonObject, this.dbusNames.daemonInterface)
      }
    } catch (error) {}

    return !!this.daemon
  }

  static async getWindow (filePath: string): Promise<[EvinceWindow, FreeDesktopApplication | undefined]> {
    // First find the internal document name
    const uri: string = url.format({
      protocol: 'file:',
      slashes: true,
      pathname: encodeURI(filePath)
    })
    const documentName = await this.daemon.FindDocument(uri, true)

    // Get the application interface and get the window list of the application
    const evinceApplication: EvinceApplication = await this.bus.getInterface(documentName, this.dbusNames.applicationObject, this.dbusNames.applicationInterface)
    const windowNames: string[] = await evinceApplication.GetWindowList()

    const evinceWindow: EvinceWindow = await this.bus.getInterface(documentName, windowNames[0], this.dbusNames.windowInterface)
    let fdApplication: FreeDesktopApplication | undefined

    if (this.dbusNames.fdApplicationObject && this.dbusNames.fdApplicationInterface) {
      // Get the GTK/FreeDesktop application interface so we can activate the window
      fdApplication = await this.bus.getInterface(documentName, this.dbusNames.fdApplicationObject, this.dbusNames.fdApplicationInterface)
    }

    return [evinceWindow, fdApplication]
  }

  get group (): Group | undefined {
    return 'opener'
  }

  async initializeWindowInstance (): Promise<void> {
    if (this.windowInstance) return

    await (this.constructor as typeof Evince).initializeDaemon()

    const [evinceWindow, fdApplication] = await (this.constructor as typeof Evince).getWindow(this.firstParameter.realFilePath)

    this.windowInstance = {
      evinceWindow,
      fdApplication,
      onClosed: this.onClosed.bind(this),
      onSyncSource: this.onSyncSource.bind(this)
    }

    this.windowInstance.evinceWindow.on('SyncSource', this.windowInstance.onSyncSource)
    this.windowInstance.evinceWindow.on('Closed', this.windowInstance.onClosed)

    await this.windowInstance.evinceWindow.SyncView('foo.tex', [0, 0], 0)
  }

  onClosed (): void {
    if (this.windowInstance) {
      this.windowInstance.evinceWindow.removeListener('SyncSource', this.windowInstance.onSyncSource)
      this.windowInstance.evinceWindow.removeListener('Closed', this.windowInstance.onClosed)
      delete this.windowInstance
    }
  }

  onSyncSource (source: string, point: [number, number]): void {
    this.sync(source, point[0], point[1])
  }

  async run (): Promise<boolean> {
    await this.initializeWindowInstance()

    if (!this.windowInstance) {
      return false
    }

    if (!this.options.openInBackground && this.windowInstance.fdApplication) {
      await this.windowInstance.fdApplication.Activate({})
    }

    if (this.options.sourcePath) {
      // SyncView seems to want to activate the window sometimes
      const sourcePath = path.resolve(this.rootPath, this.options.sourcePath)
      await this.windowInstance.evinceWindow.SyncView(sourcePath,
        [this.options.sourceLine, this.options.sourceColumn], 0)
    }

    return true
  }
}
