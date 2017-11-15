import { EventEmitter } from 'events'

import { BuilderCacheInterface, BuilderInterface, Command, LogEvent } from '@dicy/types'

import Builder from './Builder'

export default class BuilderCache extends EventEmitter implements BuilderCacheInterface {
  private cachedBuilders: Map<string, BuilderInterface> = new Map<string, BuilderInterface>()

  async get (filePath: string): Promise<BuilderInterface> {
    let builder: BuilderInterface | undefined = this.cachedBuilders.get(filePath)

    if (!builder) {
      builder = await Builder.create(filePath)
      this.cachedBuilders.set(filePath, builder)
      builder.on('log', (event: LogEvent) => this.emit('log', filePath, event))
    }

    return builder
  }

  async destroy (): Promise<void> {
    await this.killAll()
    await this.clearAll()
  }

  async setInstanceOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(filePath)
    return builder.setInstanceOptions(options, merge)
  }

  async setUserOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(filePath)
    return builder.setUserOptions(options, merge)
  }

  async setProjectOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(filePath)
    return builder.setProjectOptions(options, merge)
  }

  async setDirectoryOptions (filePath: string, options: object, merge?: boolean): Promise<void> {
    const builder: BuilderInterface = await this.get(filePath)
    return builder.setDirectoryOptions(options, merge)
  }

  async getTargetPaths (filePath: string, absolute?: boolean): Promise<string[]> {
    const builder: BuilderInterface = await this.get(filePath)
    return builder.getTargetPaths(absolute)
  }

  async clear (filePath: string): Promise<void> {
    const builder: BuilderInterface | undefined = this.cachedBuilders.get(filePath)

    if (builder) {
      builder.removeAllListeners()
      this.cachedBuilders.delete(filePath)
    }
  }

  async clearAll (): Promise<void> {
    for (const builder of this.cachedBuilders.values()) {
      builder.removeAllListeners()
    }
    this.cachedBuilders.clear()
  }

  async kill (filePath: string): Promise<void> {
    const builder: BuilderInterface = await this.get(filePath)
    await builder.kill()
  }

  async killAll (): Promise<void> {
    const killJobs = Array.from(this.cachedBuilders.values()).map(builder => builder.kill())
    await Promise.all(killJobs)
  }

  async run (filePath: string, commands: Command[]): Promise<boolean> {
    const builder: BuilderInterface = await this.get(filePath)
    return builder.run(commands)
  }

}
