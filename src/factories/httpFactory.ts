import wretch from 'wretch'
import { dedupe } from 'wretch-middlewares'

const BASE_URL = 'https://pokeapi.co/api/v2'

const http = wretch(BASE_URL)
    // Add a dedupe middleware, throttling cache would also be useful to prevent excessive token usage.
    // (https://github.com/elbywan/wretch-middlewares)
    .middlewares([
        dedupe()
    ])

function init(httpOptions = { mock: false }) {
    wretch().polyfills({
        fetch: httpOptions.mock || require('node-fetch')
    })
}
function get() {
    return http
}

export const httpFactory = {
    init,
    get
}
