import { i18nFactory } from '../factories'
import { logger } from '../utils'
import { Handler } from './index'
import { Hermes } from 'hermes-javascript'

export const cancelAlarmHandler: Handler = async function (msg, flow, hermes: Hermes) {
    logger.info('CancelAlarm')

    // End the dialog session.
    flow.end()

    // Return the TTS speech.
    const i18n = i18nFactory.get()
}
