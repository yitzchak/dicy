declare module 'readdir-enhanced' {
  export interface ReaddirEnhanced {
    async(dir: string): Promise<string[]>;
  }
}
