import { logger, translation, message, Database, getDatetimeRange, DatetimeRange } from '../utils'
import { Handler } from './index'
import { Hermes, NluSlot, slotType, grain } from 'hermes-javascript'
import commonHandler, { KnownSlots } from './common'
import {
    SLOT_CONFIDENCE_THRESHOLD
} from '../constants'

export const getAlarmHandler: Handler = async function (msg, flow, hermes: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('GetAlarm')

    const {
        name,
        recurrence
    } = await commonHandler(msg, knownSlots)

    let date: DatetimeRange | undefined

    const dateSlot: NluSlot<slotType.instantTime | slotType.timeInterval> | null = message.getSlotsByName(msg, 'datetime', {
        onlyMostConfident: true,
        threshold: SLOT_CONFIDENCE_THRESHOLD
    })

    if (dateSlot) {
        if (dateSlot.value.kind === 'TimeInterval') {
            date = getDatetimeRange({
                kind: slotType.instantTime,
                value: dateSlot.value.from,
                grain: grain.minute,
                precision: 'Exact'
            })
        } else if (dateSlot.value.kind === 'InstantTime') {
            date = getDatetimeRange(dateSlot.value)
        }
    }

    const alarms = database.get(name, date, recurrence)

    flow.end()
    return translation.getAlarmsToSpeech(alarms)
}
