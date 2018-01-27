function promisify (target: Function): any {
  return (...args: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      target(...args, (error: any, data: any) => { error ? reject(error) : resolve(data) })
    })
  }
}

const SIGNAL_PATTERN = /^on|addListener|removeListener$/

export interface DBusSignalEmitter {
  on (name: string, callback: (...args: any[]) => void): void
  addListener (name: string, callback: (...args: any[]) => void): void
  removeListener (name: string, callback: (...args: any[]) => void): void
}

export default class DBus {
  bus: any

  constructor () {
    /* tslint:disable:no-empty */
    try {
      const dbus: any = require('dbus-native')
      if (dbus) {
        this.bus = dbus.sessionBus()
      }
    } catch (error) {}
  }

  get connected (): boolean {
    return !!this.bus
  }

  listNames (): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.bus.listNames((error: any, names: string[]) => {
        if (error) {
          reject(error)
        } else {
          resolve(names)
        }
      })
    })
  }

  getInterface (serviceName: string, objectPath: string, interfaceName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bus.getInterface(serviceName, objectPath, interfaceName, (error: any, interfaceInstance: any) => {
        if (error) {
          reject(error)
        } else {
          const asyncInterface: any = {}
          const descriptors = Object.getOwnPropertyDescriptors(interfaceInstance)

          for (const name in descriptors) {
            const descriptor = descriptors[name]
            if (descriptor.enumerable) {
              if (descriptor.value) {
                if (typeof descriptor.value === 'function') {
                  const target = descriptor.value.bind(interfaceInstance)
                  descriptor.value = SIGNAL_PATTERN.test(name)
                    ? target
                    : promisify(target)
                }
                Object.defineProperty(asyncInterface, name, descriptor)
              } else {
                if (descriptor.get) {
                  asyncInterface[`get_${name}`] = promisify(descriptor.get())
                }
                if (descriptor.set) {
                  asyncInterface[`set_${name}`] = descriptor.set.bind(interfaceInstance)
                }
              }
            }
          }

          resolve(asyncInterface)
        }
      })
    })
  }
}
