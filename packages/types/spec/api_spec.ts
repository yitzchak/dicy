import { OptionDefinition } from '../src/types'
import { getOptionDefinitions } from '../src/api'

describe('getOptionDefinitions', () => {
  it('getOptionDefinitions returns option declarations and all options conform to schema', async (done) => {
    const options: OptionDefinition[] = await getOptionDefinitions()

    expect(options).toEqual(jasmine.any(Array))

    for (const option of options) {
      // @ts-ignore
      expect(option).toEqual(jasmine.objectContaining({
        name: jasmine.any(String),
        type: jasmine.stringMatching(/^(strings?|boolean|number|variable)$/),
        description: jasmine.any(String)
      }))
    }

    done()
  })
})
