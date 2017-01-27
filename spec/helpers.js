/* @flow */

import fs from 'fs-promise'
import path from 'path'
import temp from 'temp'

export async function cloneFixtures () {
  const tempPath = await fs.realpath(temp.mkdirSync('ouroboros'))
  let fixturesPath = path.resolve(__dirname, 'fixtures')
  await fs.copy(fixturesPath, tempPath)
  return tempPath
}
