import fs from 'fs'
import path from 'path'
import i18next from 'i18next'
import { DEFAULT_LANGUAGE } from '../constants'

let i18n: (key: string | string[], options?: {[key: string]: any}) => string & string[]

async function init(language = DEFAULT_LANGUAGE, i18nOptions = { mock: false }) {
    try {
        // If we are mocking.
        if(i18nOptions.mock) {
            // Stringify the key and options instead of using i18next.
            i18n = function (key, options) {
                return JSON.stringify({
                    key,
                    options
                })
            } as any
            return
        }
        // Read the language files.
        const languageResources = fs.readFileSync(path.resolve(__dirname + `/../../assets/i18n/${language}.json`), 'utf-8')
        const resources = {
            [language]: {
                translation: JSON.parse(languageResources)
            }
        }
        // Init the i18next library.
        i18n = await i18next.init({
            lng: language,
            fallbackLng: DEFAULT_LANGUAGE,
            resources
        })
    } catch (error) {
        throw new Error('localisation')
    }
}
function get() {
    return i18n
}

export const i18nFactory = {
    init,
    get
}