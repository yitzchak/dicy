import { BuilderCacheInterface, Command, Uri, Message } from '@dicy/core'
import { PassThrough } from 'stream'
import * as rpc from 'vscode-jsonrpc'

import Server from '../src/Server'

describe('Server', () => {
  const file: string = 'file://foo/bar.tex'
  let server: Server
  let client: any
  let cache: BuilderCacheInterface
  let log: (file: Uri, messages: Message[]) => void

  beforeEach(() => {
    const input: PassThrough = new PassThrough()
    const output: PassThrough = new PassThrough()
    const clientTransport: [rpc.MessageReader, rpc.MessageWriter] =
      [new rpc.StreamMessageReader(output), new rpc.StreamMessageWriter(input)]
    const serverTransport: [rpc.MessageReader, rpc.MessageWriter] =
      [new rpc.StreamMessageReader(input), new rpc.StreamMessageWriter(output)]

    cache = jasmine.createSpyObj('MockCache', [
      'clear',
      'clearAll',
      'destroy',
      'getTargets',
      'kill',
      'killAll',
      'on',
      'run',
      'setDirectoryOptions',
      'setInstanceOptions',
      'setProjectOptions',
      'setUserOptions'
    ])

    // @ts-ignore
    cache.on.and.callFake((name: string, handler: (file: Uri, messages: Message[]) => void) => {
      log = handler
      return cache
    })

    // @ts-ignore
    cache.run.and.returnValue(true)

    // @ts-ignore
    cache.getTargets.and.returnValue(['file://foo/bar.pdf'])

    client = rpc.createMessageConnection(clientTransport[0], clientTransport[1])
    client.listen()

    server = new Server(serverTransport, cache)
    server.start()
  })

  it('calls clear when request is sent', async (done) => {
    await client.sendRequest(new rpc.RequestType1<string, void, void, void>('clear'), file)

    expect(cache.clear).toHaveBeenCalledWith(file)

    done()
  })

  it('calls clearAll when request is sent', async (done) => {
    await client.sendRequest(new rpc.RequestType0<void, void, void>('clearAll'))

    expect(cache.clearAll).toHaveBeenCalledWith()

    done()
  })

  it('calls getTargets when request is sent', async (done) => {
    expect(await client.sendRequest(new rpc.RequestType1<string, void, void, void>('getTargets'), file))
      .toEqual(['file://foo/bar.pdf'])

    expect(cache.getTargets).toHaveBeenCalledWith(file)

    done()
  })

  it('calls kill when request is sent', async (done) => {
    await client.sendRequest(new rpc.RequestType2<string, string | undefined, void, void, void>('kill'), file, 'die!')

    expect(cache.kill).toHaveBeenCalledWith(file, 'die!')

    done()
  })

  it('calls killAll when request is sent', async (done) => {
    await client.sendRequest(new rpc.RequestType1<string | undefined, void, void, void>('killAll'), 'zap!')

    expect(cache.killAll).toHaveBeenCalledWith('zap!')

    done()
  })

  it('calls run when request is sent', async (done) => {
    const commands: Command[] = ['load', 'build', 'save']

    expect(await client.sendRequest(new rpc.RequestType2<string, Command[], void, void, void>('run'), file, commands)).toBeTruthy()

    expect(cache.run).toHaveBeenCalledWith(file, commands)

    done()
  })

  it('calls setInstanceOptions when request is sent', async (done) => {
    const options: object = { foo: 'bar' }

    await client.sendRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setInstanceOptions'), file, options, true)

    expect(cache.setInstanceOptions).toHaveBeenCalledWith(file, options, true)

    done()
  })

  it('calls setDirectoryOptions when request is sent', async (done) => {
    const options: object = { foo: 'bar' }

    await client.sendRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setDirectoryOptions'), file, options, true)

    expect(cache.setDirectoryOptions).toHaveBeenCalledWith(file, options, true)

    done()
  })

  it('calls setProjectOptions when request is sent', async (done) => {
    const options: object = { foo: 'bar' }

    await client.sendRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setProjectOptions'), file, options, true)

    expect(cache.setProjectOptions).toHaveBeenCalledWith(file, options, true)

    done()
  })

  it('calls setUserOptions when request is sent', async (done) => {
    const options: object = { foo: 'bar' }

    await client.sendRequest(new rpc.RequestType3<string, object, boolean | undefined, void, void, void>('setUserOptions'), file, options, true)

    expect(cache.setUserOptions).toHaveBeenCalledWith(file, options, true)

    done()
  })

  it('sends log notification when message are generated', async (done) => {
    const messages: Message[] = [{
      severity: 'error',
      text: 'Dive!'
    }]
    const logSpy = jasmine.createSpy('logSpy')

    client.onNotification(new rpc.NotificationType2<Uri, Message[], void>('log'), logSpy)

    log(file, messages)

    setTimeout(() => {
      expect(logSpy).toHaveBeenCalledWith(file, messages)

      done()
    }, 500)
  })
})
