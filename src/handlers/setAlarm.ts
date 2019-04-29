import { logger, translation, message, Database } from '../utils'
import { Handler } from './index'
import { Hermes, NluSlot, slotType } from 'hermes-javascript'
import commonHandler, { KnownSlots } from './common'
import { Alarm } from '../utils/alarm'
import {
    SLOT_CONFIDENCE_THRESHOLD
} from '../constants'
import { getExactDate } from '../utils'

export const setAlarmHandler: Handler = async function (msg, flow, _: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('SetAlarm')

    const {
        name,
        recurrence
    } = await commonHandler(msg, knownSlots)

    let date: Date | undefined

    const dateSlot: NluSlot<slotType.instantTime | slotType.timeInterval> | null = message.getSlotsByName(msg, 'datetime', {
        onlyMostConfident: true,
        threshold: SLOT_CONFIDENCE_THRESHOLD
    })

    if (dateSlot) {
        if (dateSlot.value.kind === 'TimeInterval') {
            date = getExactDate({ date: dateSlot.value.from })
        } else if (dateSlot.value.kind === 'InstantTime') {
            date = getExactDate({ date: dateSlot.value.value, grain: dateSlot.value.kind })
        }
    }

    if (!date) {
        throw new Error('intentNotRecognized')
    }

    logger.info('\tdate: ', date)
    
    const alarm: Alarm = database.add({
        date,
        recurrence,
        name
    })
    
    flow.end()
    return translation.setAlarmToSpeech(alarm)
}
