import { BuilderInterface, Command, Message, Uri } from '@dicy/types'
import { PassThrough } from 'stream'
import * as rpc from 'vscode-jsonrpc'

import Client from '../src/Client'

describe('Server', () => {
  const file: string = 'file://foo/bar.tex'
  const targets: string[] = ['file://foo/bar.pdf']
  const commands: Command[] = ['load', 'build', 'log']
  let client: Client
  let server: any

  beforeEach(async (done) => {
    const input: PassThrough = new PassThrough()
    const output: PassThrough = new PassThrough()
    const clientTransport: [rpc.MessageReader, rpc.MessageWriter] =
      [new rpc.StreamMessageReader(output), new rpc.StreamMessageWriter(input)]
    const serverTransport: [rpc.MessageReader, rpc.MessageWriter] =
      [new rpc.StreamMessageReader(input), new rpc.StreamMessageWriter(output)]

    client = new Client(false)
    spyOn(client, 'createTransport').and.returnValue(clientTransport)

    server = rpc.createMessageConnection(serverTransport[0], serverTransport[1])
    server.listen()

    await client.start()

    done()
  })

  it('sends clear request when clear is called', async (done) => {
    const clearSpy = jasmine.createSpy('clear')

    server.onRequest(new rpc.RequestType1<string, void, void, void>('clear'), clearSpy)

    await client.clear(file)

    expect(clearSpy).toHaveBeenCalledWith(file, jasmine.anything())

    done()
  })

  it('sends clearAll request when clearAll is called', async (done) => {
    const clearAllSpy = jasmine.createSpy('clear')

    server.onRequest(new rpc.RequestType0<void, void, void>('clearAll'), clearAllSpy)

    await client.clearAll()

    expect(clearAllSpy).toHaveBeenCalledWith(jasmine.anything())

    done()
  })

  it('sends getTargets request when getTargets is called', async (done) => {
    const getTargetsSpy = jasmine.createSpy('getTargets')

    getTargetsSpy.and.returnValue(targets)
    server.onRequest(new rpc.RequestType1<string, string[], void, void>('getTargets'), getTargetsSpy)

    expect(await client.getTargets(file)).toEqual(targets)

    expect(getTargetsSpy).toHaveBeenCalledWith(file, jasmine.anything())

    done()
  })

  it('sends getTargets request when getTargets is called on builder', async (done) => {
    const getTargetsSpy = jasmine.createSpy('getTargets')

    getTargetsSpy.and.returnValue(targets)
    server.onRequest(new rpc.RequestType1<string, string[], void, void>('getTargets'), getTargetsSpy)

    const builder: BuilderInterface = await client.get(file)
    expect(await builder.getTargets()).toEqual(targets)

    expect(getTargetsSpy).toHaveBeenCalledWith(file, jasmine.anything())

    done()
  })

  it('sends kill request when kill is called', async (done) => {
    const killSpy = jasmine.createSpy('kill')

    server.onRequest(new rpc.RequestType2<string, string | undefined, void, void, void>('kill'), killSpy)

    await client.kill(file, 'die!')

    expect(killSpy).toHaveBeenCalledWith(file, 'die!', jasmine.anything())

    done()
  })

  it('sends kill request when kill is called on builder', async (done) => {
    const killSpy = jasmine.createSpy('kill')

    server.onRequest(new rpc.RequestType2<string, string | undefined, void, void, void>('kill'), killSpy)

    const builder: BuilderInterface = await client.get(file)
    await builder.kill('finito!')

    expect(killSpy).toHaveBeenCalledWith(file, 'finito!', jasmine.anything())

    done()
  })

  it('sends killAll request when killAll is called', async (done) => {
    const killAllSpy = jasmine.createSpy('clear')

    server.onRequest(new rpc.RequestType1<string | undefined, void, void, void>('killAll'), killAllSpy)

    await client.killAll('zap!')

    expect(killAllSpy).toHaveBeenCalledWith('zap!', jasmine.anything())

    done()
  })

  it('sends run request when run is called', async (done) => {
    const runSpy = jasmine.createSpy('run')

    server.onRequest(new rpc.RequestType2<string, Command[], void, void, void>('run'), runSpy)

    await client.run(file, commands)

    expect(runSpy).toHaveBeenCalledWith(file, commands, jasmine.anything())

    done()
  })

  it('sends run request when run is called on builder', async (done) => {
    const runSpy = jasmine.createSpy('run')

    server.onRequest(new rpc.RequestType2<string, Command[], void, void, void>('run'), runSpy)

    const builder: BuilderInterface = await client.get(file)
    await builder.run(commands)

    expect(runSpy).toHaveBeenCalledWith(file, commands, jasmine.anything())

    done()
  })

  it('sends setDirectoryOptions request when setDirectoryOptions is called', async (done) => {
    const setDirectoryOptionsSpy = jasmine.createSpy('setDirectoryOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions'), setDirectoryOptionsSpy)

    await client.setDirectoryOptions(file, { foo: 'bar' }, true)

    expect(setDirectoryOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('sends setDirectoryOptions request when setDirectoryOptions is called on builder', async (done) => {
    const setDirectoryOptionsSpy = jasmine.createSpy('setDirectoryOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions'), setDirectoryOptionsSpy)

    const builder: BuilderInterface = await client.get(file)
    await builder.setDirectoryOptions({ foo: 'bar' }, true)

    expect(setDirectoryOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('sends setProjectOptions request when setProjectOptions is called', async (done) => {
    const setProjectOptionsSpy = jasmine.createSpy('setProjectOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setProjectOptions'), setProjectOptionsSpy)

    await client.setProjectOptions(file, { foo: 'bar' }, true)

    expect(setProjectOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('sends setProjectOptions request when setProjectOptions is called on builder', async (done) => {
    const setProjectOptionsSpy = jasmine.createSpy('setProjectOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setProjectOptions'), setProjectOptionsSpy)

    const builder: BuilderInterface = await client.get(file)
    await builder.setProjectOptions({ foo: 'bar' }, true)

    expect(setProjectOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('sends setDirectoryOptions request when setDirectoryOptions is called', async (done) => {
    const setDirectoryOptionsSpy = jasmine.createSpy('setDirectoryOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions'), setDirectoryOptionsSpy)

    await client.setDirectoryOptions(file, { foo: 'bar' }, true)

    expect(setDirectoryOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('sends setDirectoryOptions request when setDirectoryOptions is called on builder', async (done) => {
    const setDirectoryOptionsSpy = jasmine.createSpy('setDirectoryOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions'), setDirectoryOptionsSpy)

    const builder: BuilderInterface = await client.get(file)
    await builder.setDirectoryOptions({ foo: 'bar' }, true)

    expect(setDirectoryOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('sends setUserOptions request when setUserOptions is called', async (done) => {
    const setUserOptionsSpy = jasmine.createSpy('setUserOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setUserOptions'), setUserOptionsSpy)

    await client.setUserOptions(file, { foo: 'bar' }, true)

    expect(setUserOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('sends setUserOptions request when setUserOptions is called on builder', async (done) => {
    const setUserOptionsSpy = jasmine.createSpy('setUserOptions')

    server.onRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setUserOptions'), setUserOptionsSpy)

    const builder: BuilderInterface = await client.get(file)
    await builder.setUserOptions({ foo: 'bar' }, true)

    expect(setUserOptionsSpy).toHaveBeenCalledWith(file, { foo: 'bar' }, true, jasmine.anything())

    done()
  })

  it('emits log event when log notification is sent', async (done) => {
    const messages: Message[] = [{
      severity: 'error',
      text: 'Dive!'
    }]
    const logSpy = jasmine.createSpy('logSpy')

    client.on('log', logSpy)
    server.sendNotification(new rpc.NotificationType2<Uri, Message[], void>('log'), file, messages)

    setTimeout(() => {
      expect(logSpy).toHaveBeenCalledWith(file, messages)

      done()
    }, 500)
  })

  it('emits log event on correct builder when log notification is sent', async (done) => {
    const messages: Message[] = [{
      severity: 'error',
      text: 'Dive!'
    }]
    const fooSpy = jasmine.createSpy('logSpy')
    const fooBuilder: BuilderInterface = await client.get(file)
    const quuxSpy = jasmine.createSpy('logSpy')
    const quuxBuilder: BuilderInterface = await client.get('file://baz/quux.tex')

    fooBuilder.on('log', fooSpy)
    quuxBuilder.on('log', quuxSpy)

    server.sendNotification(new rpc.NotificationType2<Uri, Message[], void>('log'), file, messages)

    setTimeout(() => {
      expect(fooSpy).toHaveBeenCalledWith(messages)
      expect(quuxSpy).not.toHaveBeenCalled()

      done()
    }, 500)
  })
})
