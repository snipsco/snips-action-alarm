import { logger, translation, message, Database, getDateRange, DateRange } from '../utils'
import { Handler } from './index'
import { Hermes, NluSlot, slotType } from 'hermes-javascript'
import commonHandler, { KnownSlots } from './common'
import {
    SLOT_CONFIDENCE_THRESHOLD
} from '../constants'
import { i18nFactory } from '../factories'

export const cancelAlarmHandler: Handler = async function (msg, flow, _: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    const i18n = i18nFactory.get()

    logger.info('CancelAlarm')

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

    if (alarms.length > 0) {
        flow.continue('snips-assistant:Yes', (_, flow) => {
            alarms.forEach(alarm => {
                database.deleteById(alarm.id)
            })
    
            flow.end()
            if (alarms.length === 1) {
                return i18n('cancelAlarm.successfullyDeletedSingle')
            } else {
                return i18n('cancelAlarm.successfullyDeletedAll')
            }
        })
        flow.continue('snips-assistant:No', (_, flow) => {
            flow.end()
        })

        if (alarms.length === 1) {
            return translation.getAlarmsToSpeech(alarms, name, dateRange, recurrence) + ' ' + i18n('cancelAlarm.confirmationSingle')
        }
        return translation.getAlarmsToSpeech(alarms, name, dateRange, recurrence) + ' ' + i18n('cancelAlarm.confirmationAll')
    }

    return i18n('getAlarms.head.foundAlarms', {
        number: 0, odd: ''
    })
}
