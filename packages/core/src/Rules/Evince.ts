import { Command } from '@dicy/types'
import { EventEmitter } from 'events'
import * as url from 'url'

import File from '../File'
import Rule from '../Rule'
import StateConsumer from '../StateConsumer'
import { Phase } from '../types'

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

interface EvinceDaemon {
  RegisterDocument (uri: string, callback: (error: any, owner: string) => void): void
  UnregisterDocument (uri: string, callback: (error: any) => void): void
  FindDocument (uri: string, spawn: boolean, callback: (error: any, owner: string) => void): void
}

interface EvinceApplication {
  Reload (args: { [ name: string ]: any }, timestamp: number, callback: (error: any) => void): void
  GetWindowList (callback: (error: any, windows: string[]) => void): void
}

interface EvinceWindow extends EventEmitter {
  SyncView (sourceFile: string, sourcePoint: [number, number], timestamp: number, callback: (error: any) => void): void
  on (signal: 'SyncSource', callback: (sourceFile: string, sourcePoint: [number, number], timestamp: number) => void): this
  on (signal: 'Closed', callback: () => void): this
  on (signal: 'DocumentLoaded', callback: (uri: string) => void): this
}

interface FreedDesktopApplication {
  Activate (platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
  ActivateAction (actionName: string, parameter: string[], platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
  Open (uris: string[], platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
}

function syncSource (uri: string, point: [number, number]) {
  const filePath = decodeURI(url.parse(uri).pathname || '')
  // atom.focus()
  // atom.workspace.open(filePath).then(editor => (editor as TextEditor).setCursorBufferPosition(point))
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
  static bus: any
  static daemon: EvinceDaemon

  evinceWindow: EvinceWindow
  onClosed: () => void
  fdApplication?: FreedDesktopApplication

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (process.platform !== 'linux' || parameters.every(file => file.virtual || !consumer.isOutputTarget(file))) {
      return false
    }

    if (this.daemon) {
      return true
    }

    try {
      const dbus = require('dbus-native')
      this.bus = dbus.sessionBus()
      this.daemon = await this.getInterface(this.dbusNames.daemonService, this.dbusNames.daemonObject, this.dbusNames.daemonInterface)
    } catch (e) {
      return false
    }

    return !!this.daemon
  }

  static getInterface (serviceName: string, objectPath: string, interfaceName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bus.getInterface(serviceName, objectPath, interfaceName, (error: any, interfaceInstance: any) => {
        if (error) {
          reject(error)
        } else {
          resolve(interfaceInstance)
        }
      })
    })
  }

  static findDocument (filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uri: string = url.format({
        protocol: 'file:',
        slashes: true,
        pathname: encodeURI(filePath)
      })

      this.daemon.FindDocument(uri, true, (error, documentName) => {
        if (error) {
          reject(error)
        } else {
          resolve(documentName)
        }
      })
    })
  }

  async initialize () {
    const statics: typeof Evince = this.constructor as typeof Evince
    const filePath: string = this.firstParameter.realFilePath

    // First find the internal document name
    const documentName = await statics.findDocument(filePath)

    // Get the application interface and get the window list of the application
    const evinceApplication: EvinceApplication = await statics.getInterface(documentName, statics.dbusNames.applicationObject, statics.dbusNames.applicationInterface)
    const windowNames: string[] = await this.getWindowList(evinceApplication)

    // Get the window interface of the of the first (only) window
    this.onClosed = () => this.dispose.bind(this)
    this.evinceWindow = await statics.getInterface(documentName, windowNames[0], statics.dbusNames.windowInterface)

    if (statics.dbusNames.fdApplicationObject && statics.dbusNames.fdApplicationInterface) {
      // Get the GTK/FreeDesktop application interface so we can activate the window
      this.fdApplication = await statics.getInterface(documentName, statics.dbusNames.fdApplicationObject, statics.dbusNames.fdApplicationInterface)
    }

    this.evinceWindow.on('SyncSource', syncSource)
    this.evinceWindow.on('Closed', this.onClosed)

    // This seems to help with future syncs
    // await this.syncView(this.evinceWindow, sourcePath, [0, 0], 0)
  }

  dispose (): void {
    if (this.evinceWindow) {
      this.evinceWindow.removeListener('SyncSource', syncSource)
      this.evinceWindow.removeListener('Closed', this.onClosed)
    }
  }

  async run (): Promise<boolean> {
    if (!this.options.openInBackground && this.fdApplication) {
      this.fdApplication.Activate({})
    }

    // SyncView seems to want to activate the window sometimes
    await this.syncView(this.options.sourcePath, [this.options.sourceLine, 0], 0)

    return true
  }

  getWindowList (evinceApplication: EvinceApplication): Promise<string[]> {
    return new Promise((resolve, reject) => {
      evinceApplication.GetWindowList((error, windowNames) => {
        if (error) {
          reject(error)
        } else {
          resolve(windowNames)
        }
      })
    })
  }

  syncView (source: string, point: [number, number], timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.evinceWindow.SyncView(source, point, timestamp, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}
