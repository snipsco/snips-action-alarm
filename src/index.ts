import fs from 'fs'
import path from 'path'
import { withHermes } from 'hermes-javascript'
import bootstrap from './bootstrap'
import handlers from './handlers'
import { translation, logger } from './utils'
import { Database } from './utils/alarm/database'

const alarmWav = fs.readFileSync(path.resolve(__dirname, '../assets/alarm.wav'))

// Initialize hermes
export default function ({
    hermesOptions = {},
    bootstrapOptions = {}
} = {}) : Promise<() => void>{
    return new Promise((resolve, reject) => {
        withHermes(async (hermes, done) => {
            try {
                // Bootstrap config, locale, i18n…
                await bootstrap(bootstrapOptions)
                const dialog = hermes.dialog()

                // Publish the alarm sound.
                hermes.tts().publish('register_sound', {
                    soundId: 'alarm.beep',
                    wavSound: alarmWav.toString('base64'),
                    wavSoundLen: alarmWav.length
                })

                const database = new Database(hermes)

                dialog.flows([
                    {
                        intent: 'snips-assistant:SetAlarm',
                        action: (msg, flow) => handlers.setAlarm(msg, flow, hermes, database)
                    },
                    {
                        intent: 'snips-assistant:GetAlarm',
                        action: (msg, flow) => handlers.getAlarm(msg, flow, hermes, database)
                    },
                    {
                        intent: 'snips-assistant:RescheduleAlarm',
                        action: (msg, flow) => handlers.rescheduleAlarm(msg, flow, hermes, database)
                    },
                    {
                        intent: 'snips-assistant:CancelAlarm',
                        action: (msg, flow) => handlers.cancelAlarm(msg, flow, hermes, database)
                    }
                ])
                resolve(done)
            } catch (error) {
                // Output initialization errors to stderr and exit
                const message = await translation.errorMessage(error)
                logger.error(message)
                logger.error(error)
                // Exit
                done()
                // Reject
                reject(error)
            }
        }, hermesOptions)
    })
}
