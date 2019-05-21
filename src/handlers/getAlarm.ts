import { translation, Database, getDateRange, DateRange } from '../utils'
import { Handler, logger, message } from 'snips-toolkit'
import { Hermes } from 'hermes-javascript'
import { NluSlot, slotType } from 'hermes-javascript/types'
import commonHandler, { KnownSlots } from './common'
import { SLOT_CONFIDENCE_THRESHOLD } from '../constants'

export const getAlarmHandler: Handler = async function (msg, flow, _: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('GetAlarm')

    const {
        name,
        recurrence
    } = await commonHandler(msg, knownSlots)

    let dateRange: DateRange | undefined

    const dateSlot: NluSlot<slotType.instantTime | slotType.timeInterval> | null = message.getSlotsByName(msg, 'datetime', {
        onlyMostConfident: true,
        threshold: SLOT_CONFIDENCE_THRESHOLD
    })

    if (dateSlot) {
        if (dateSlot.value.kind === slotType.timeInterval) {
            dateRange = { min: new Date(dateSlot.value.from), max: new Date(dateSlot.value.to) }
        } else if (dateSlot.value.kind === slotType.instantTime) {
            dateRange = getDateRange(new Date(dateSlot.value.value), dateSlot.value.grain)
        }
    }

    const alarms = database.get(name, dateRange, recurrence)

    flow.end()
    return translation.getAlarmsToSpeech(alarms, name, dateRange, recurrence)
}
