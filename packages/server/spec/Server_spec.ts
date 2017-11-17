import { BuilderCacheInterface } from '@dicy/core'
import * as memory from 'memory-streams'
import { Readable, Writable } from 'stream'
import * as rpc from 'vscode-jsonrpc'

import Server from '../src/Server'

describe('Server', () => {
  let server: Server
  let cache: BuilderCacheInterface
  let input: Readable
  let output: Writable

  beforeEach(() => {
    cache = jasmine.createSpyObj('MockCache', {
      clear: Promise.resolve()
    })
    input = new memory.ReadableStream()
    output = new memory.WritableStream()
    const transport: [rpc.MessageReader, rpc.MessageWriter] = [new rpc.StreamMessageReader(input), new rpc.StreamMessageWriter(output)]
    server = new Server(transport, cache)
    server.start()
  })

  afterEach(async (done) => {
    await server.destroy()
    done()
  })
})
