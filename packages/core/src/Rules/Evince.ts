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

interface FreeDesktopApplication {
  Activate (platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
  ActivateAction (actionName: string, parameter: string[], platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
  Open (uris: string[], platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
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
  static bus: any
  static daemon: EvinceDaemon

  windowInstance?: WindowInstance

  static async isApplicable (consumer: StateConsumer, command: Command, phase: Phase, parameters: File[] = []): Promise<boolean> {
    if (process.platform !== 'linux' || parameters.every(file => file.virtual || !consumer.isOutputTarget(file))) {
      return false
    }

    if (this.daemon) {
      return true
    }

    try {
      if (!this.bus) {
        const dbus = require('dbus-native')
        this.bus = dbus.sessionBus()
      }

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

  static getWindowList (evinceApplication: EvinceApplication): Promise<string[]> {
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

  static async getWindow (filePath: string): Promise<[EvinceWindow, FreeDesktopApplication | undefined]> {
    // First find the internal document name
    const documentName = await this.findDocument(filePath)

    // Get the application interface and get the window list of the application
    const evinceApplication: EvinceApplication = await this.getInterface(documentName, this.dbusNames.applicationObject, this.dbusNames.applicationInterface)
    const windowNames: string[] = await this.getWindowList(evinceApplication)

    const evinceWindow: EvinceWindow = await this.getInterface(documentName, windowNames[0], this.dbusNames.windowInterface)
    let fdApplication: FreeDesktopApplication | undefined

    if (this.dbusNames.fdApplicationObject && this.dbusNames.fdApplicationInterface) {
      // Get the GTK/FreeDesktop application interface so we can activate the window
      fdApplication = await this.getInterface(documentName, this.dbusNames.fdApplicationObject, this.dbusNames.fdApplicationInterface)
    }

    return [evinceWindow, fdApplication]
  }

  async initializeWindowInstance (): Promise<void> {
    if (this.windowInstance) return

    const [evinceWindow, fdApplication] = await (this.constructor as typeof Evince).getWindow(this.firstParameter.realFilePath)

    this.windowInstance = {
      evinceWindow,
      fdApplication,
      onClosed: this.onClosed.bind(this),
      onSyncSource: this.onSyncSource.bind(this)
    }

    this.windowInstance.evinceWindow.on('SyncSource', this.windowInstance.onSyncSource)
    this.windowInstance.evinceWindow.on('Closed', this.windowInstance.onClosed)
  }

  onClosed (): void {
    if (this.windowInstance) {
      this.windowInstance.evinceWindow.removeListener('SyncSource', this.windowInstance.onSyncSource)
      this.windowInstance.evinceWindow.removeListener('Closed', this.windowInstance.onClosed)
      delete this.windowInstance
    }
  }

  onSyncSource (source: string, point: [number, number]): void {
    this.sync(source, point[0])
  }

  async run (): Promise<boolean> {
    await this.initializeWindowInstance()

    if (!this.windowInstance) {
      return false
    }

    if (!this.options.openInBackground && this.windowInstance.fdApplication) {
      this.windowInstance.fdApplication.Activate({})
    }

    if (this.options.sourcePath) {
      // SyncView seems to want to activate the window sometimes
      await this.syncView(this.options.sourcePath, [this.options.sourceLine, 0], 0)
    }

    return true
  }

  syncView (source: string, point: [number, number], timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.windowInstance) {
        this.windowInstance.evinceWindow.SyncView(source, point, timestamp, (error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      } else {
        reject()
      }
    })
  }
}
