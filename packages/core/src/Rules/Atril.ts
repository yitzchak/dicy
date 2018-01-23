import { DBusNames, default as Evince } from './Evince'

export default class Atril extends Evince {
  static description: string = 'Open targets using atril.'

  static dbusNames: DBusNames = {
    applicationObject: '/org/mate/atril/Atril',
    applicationInterface: 'org.mate.atril.Application',

    daemonService: 'org.mate.atril.Daemon',
    daemonObject: '/org/mate/atril/Daemon',
    daemonInterface: 'org.mate.atril.Daemon',

    windowInterface: 'org.mate.atril.Window'
  }
}
