import { logger, translation, message, Database, getDateRange, DateRange } from '../utils'
import { Handler } from './index'
import { Hermes, NluSlot, slotType, grain } from 'hermes-javascript'
import commonHandler, { KnownSlots } from './common'
import {
    SLOT_CONFIDENCE_THRESHOLD
} from '../constants'

export const getAlarmHandler: Handler = async function (msg, flow, _: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('GetAlarm')

    const {
        name,
        date,
        recurrence
    } = await commonHandler(msg, knownSlots)

    let dateRange: DateRange | undefined, grain: string | undefined

    const dateSlot: NluSlot<slotType.instantTime | slotType.timeInterval> | null = message.getSlotsByName(msg, 'datetime', {
        onlyMostConfident: true,
        threshold: SLOT_CONFIDENCE_THRESHOLD
    })

    if (dateSlot) {
        if (dateSlot.value.kind === slotType.timeInterval) {
            dateRange = { min: new Date(dateSlot.value.from), max: new Date(dateSlot.value.to) }
        } else if (dateSlot.value.kind === slotType.instantTime) {
            grain = dateSlot.value.grain
            dateRange = getDateRange(new Date(dateSlot.value.value), grain)
        }
    }

    const alarms = database.get(name, dateRange, recurrence)

    flow.end()
    return translation.getAlarmsToSpeech(alarms, name, date, grain, recurrence)
}
