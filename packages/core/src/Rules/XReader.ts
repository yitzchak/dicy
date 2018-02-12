import { DBusNames, default as Evince } from './Evince'

export default class XReader extends Evince {
  static dbusNames: DBusNames = {
    applicationObject: '/org/x/reader/Xreader',
    applicationInterface: 'org.x.reader.Application',

    daemonService: 'org.x.reader.Daemon',
    daemonObject: '/org/x/reader/Daemon',
    daemonInterface: 'org.x.reader.Daemon',

    windowInterface: 'org.x.reader.Window'
  }
}
