import { i18nFactory } from '../factories'
import { logger } from '../utils'
import { Handler } from './index'
import { Hermes } from 'hermes-javascript'

export const rescheduleAlarmHandler: Handler = async function (msg, flow, hermes: Hermes) {
    logger.info('RescheduleAlarm')

    // End the dialog session.
    flow.end()

    // Return the TTS speech.
    const i18n = i18nFactory.get()
}
