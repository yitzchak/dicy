function promisify (target: Function): any {
  return (...args: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      target(...args, (error: any, data: any) => { error ? reject(error) : resolve(data) })
    })
  }
}

const SIGNAL_PATTERN = /^on|addListener|removeListener$/

export default class DBus {
  private bus: any

  constructor () {
    const dbus: any = require('dbus-native')
    if (dbus) {
      this.bus = dbus.sessionBus()
    }
  }

  get connected (): boolean {
    return !!this.bus
  }

  getInterface (serviceName: string, objectPath: string, interfaceName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bus.getInterface(serviceName, objectPath, interfaceName, (error: any, interfaceInstance: any) => {
        if (error) {
          reject(error)
        } else {
          const asyncInterface: any = {}

          for (const name in interfaceInstance) {
            const target = interfaceInstance[name].bind(interfaceInstance)
            asyncInterface[name] = SIGNAL_PATTERN.test(name)
              ? target
              : promisify(target)
          }

          resolve(asyncInterface)
        }
      })
    })
  }
}
