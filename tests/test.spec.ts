require('./helpers/setup').bootstrap()

import Session from './helpers/session'
import { createPokemonIdSlot } from './utils'

it('should query a Pokemon by its id and output its name', async () => {
    const session = new Session()
    await session.start({
        intentName: 'pokemon',
        input: 'Give me the details for Pokemon 1',
        slots: [
            createPokemonIdSlot('1')
        ]
    })
    // In test mode, the i18n output is mocked as a JSON containing the i18n key and associated options.
    // (basically the arguments passed to i18n, in serialized string form)
    const endSessionMessage = await session.end()
    const { key, options } = JSON.parse(endSessionMessage.text || '')
    expect(key).toBe('pokemon.info')
    expect(options.name).toBe('bulbasaur')
    expect(options.weight).toBe(69)
    expect(options.height).toBe(7)
})