import { EventEmitter } from 'events'
const url2path = require('file-uri-to-path')

import {
  BuilderCacheInterface, BuilderInterface, Command, Message, OptionsSource, Uri
} from '@dicy/types'

import Builder from './Builder'

export default class BuilderCache extends EventEmitter implements BuilderCacheInterface {
  private cachedBuilders: Map<string, BuilderInterface> = new Map<string, BuilderInterface>()

  async get (file: Uri): Promise<BuilderInterface> {
    let builder: BuilderInterface | undefined = this.cachedBuilders.get(file)

    if (!builder) {
      builder = await Builder.create(url2path(file))
      this.cachedBuilders.set(file, builder)
      builder.on('log', (messages: Message[]) => this.emit('log', file, messages))
    }

    return builder
  }

  async destroy (): Promise<void> {
    await this.killAll()
    await this.clearAll()
  }

  async setInstanceOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(file)
    return builder.setInstanceOptions(options, merge)
  }

  async setUserOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(file)
    return builder.setUserOptions(options, merge)
  }

  async setProjectOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(file)
    return builder.setProjectOptions(options, merge)
  }

  async setDirectoryOptions (file: Uri, options: OptionsSource, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(file)
    return builder.setDirectoryOptions(options, merge)
  }

  async getTargets (file: Uri): Promise<string[]> {
    const builder: BuilderInterface = await this.get(file)
    return builder.getTargets()
  }

  async clear (file: Uri): Promise<void> {
    const builder: BuilderInterface | undefined = this.cachedBuilders.get(file)

    if (builder) {
      builder.removeAllListeners()
      this.cachedBuilders.delete(file)
    }
  }

  async clearAll (): Promise<void> {
    for (const builder of this.cachedBuilders.values()) {
      builder.removeAllListeners()
    }
    this.cachedBuilders.clear()
  }

  async kill (file: Uri): Promise<void> {
    const builder: BuilderInterface = await this.get(file)
    await builder.kill()
  }

  async killAll (): Promise<void> {
    const killJobs = Array.from(this.cachedBuilders.values()).map(builder => builder.kill())
    await Promise.all(killJobs)
  }

  async run (file: Uri, commands: Command[]): Promise<boolean> {
    const builder: BuilderInterface = await this.get(file)
    return builder.run(commands)
  }

}
