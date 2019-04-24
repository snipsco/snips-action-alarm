import { createServer, AddressInfo } from 'net'
import camelcase from 'camelcase'

export function camelize(item) {
    if(typeof item !== 'object' || !item)
        return item
    if(item instanceof Array) {
        return item.map(value => camelize(value))
    }
    Object.entries(item).forEach(([ key, value ]) => {
        const camelizedKey = camelcase(key)
        const isSameKey = key === camelizedKey
        item[camelizedKey] = camelize(value)
        if(!isSameKey) {
            delete item[key]
        }
    })
    return item
}

export function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createServer()
        server.on('error', err => {
            reject(err)
        })
        server.on('listening', () => {
            const port: number = (server.address() as AddressInfo)['port']
            server.close()
            resolve(port)
        })
        server.listen()
    })
}

export function getMessageKey(message) {
    return JSON.parse(message.text).key
}

