import fs from 'fs'
import path from 'path'
import ini from 'ini'
import { camelize } from '../utils/camelize'
import { logger } from '../utils/logger'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../constants'

let config: {[key: string]: string} = {}

function init (configOptions = { mock: {}}) {
    try {
        // Get the config file.
        const configFilePath = path.resolve(__dirname + '/../../config.ini')
        const iniConfig = ini.parse(fs.readFileSync(configFilePath, 'utf8'))
        // Assume that the file keys are in snake case, and camelize them.
        for (let section in iniConfig) {
            config = {
                ...config,
                ...camelize.camelizeKeys(iniConfig[section]),
                ...(configOptions.mock || {})
            }
        }
        if(!config.locale) {
            config.locale = DEFAULT_LOCALE
        }
    } catch (error) {
        logger.error(error)
        throw new Error('config')
    }

    if (!(SUPPORTED_LOCALES.includes(config.locale))) {
        throw new Error('localisation')
    }
}

function get() {
    return config
}

export const configFactory = {
    init,
    get
}
