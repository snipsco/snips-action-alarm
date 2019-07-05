import { Hermes, Done } from 'hermes-javascript'
import { config, i18n, logger } from 'snips-toolkit'
import handlers from './handlers'
import fs from 'fs'
import path from 'path'
import { Database } from './utils'
import { DB_DIR, ASSETS_DIR } from './constants'

// Enables deep printing of objects.
process.env.DEBUG_DEPTH = undefined

const alarmWav = fs.readFileSync(
    path.resolve(ASSETS_DIR, 'alarm.wav')
)

export default async function ({
    hermes,
    done
}: {
    hermes: Hermes,
    done: Done
}) {
    try {
        const { name } = require('../package.json')
        logger.init(name)
        // Replace 'error' with '*' to log everything
        logger.enable('error')

        if (!fs.existsSync(DB_DIR)){
            fs.mkdirSync(DB_DIR)
        }

        config.init()
        await i18n.init(config.get().locale)

        const dialog = hermes.dialog()

        // Publish the alarm sound.
        hermes.tts().publish('register_sound', {
            soundId: 'alarm.beep',
            wavSound: alarmWav.toString('base64'),
            wavSoundLen: alarmWav.length
        })

        const database = new Database(hermes)

        // Subscribe to the app intents
        dialog.flows([
            {
                intent: `${ config.get().assistantPrefix }:SetAlarm`,
                action: (msg, flow) => handlers.setAlarm(msg, flow, database)
            },
            {
                intent: `${ config.get().assistantPrefix }:GetAlarm`,
                action: (msg, flow) => handlers.getAlarm(msg, flow, database)
            },
            {
                intent: `${ config.get().assistantPrefix }:CancelAlarm`,
                action: (msg, flow) => handlers.cancelAlarm(msg, flow, database)
            }
        ])
    } catch (error) {
        // Output initialization errors to stderr and exit
        const message = await i18n.errorMessage(error)
        logger.error(message)
        logger.error(error)
        // Exit
        done()
    }
}
