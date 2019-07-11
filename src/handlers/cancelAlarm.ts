import { Database, getDateRange, DateRange } from '../utils'
import { Alarm } from '../utils/alarm/alarm'
import { Handler, logger, message, i18n, config } from 'snips-toolkit'
import { NluSlot, slotType } from 'hermes-javascript/types'
import commonHandler, { KnownSlots } from './common'
import { SLOT_CONFIDENCE_THRESHOLD } from '../constants'

export const cancelAlarmHandler: Handler = async function (msg, flow, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('CancelAlarm')

    const {
        name,
        recurrence
    } = await commonHandler(msg, knownSlots)

    let dateRange: DateRange | undefined

    if (!('dateRange' in knownSlots)) {
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
    } else {
        dateRange = knownSlots.dateRange
    }

    const alarms: Alarm[] = database.get(name, dateRange, recurrence)
    const length = alarms.length

    // Cancel all the alarms, need to be confirmed
    if (length && (!name && !recurrence && !dateRange)) {
        flow.continue(`${ config.get().assistantPrefix }:Yes`, (_, flow) => {
            alarms.forEach(alarm => {
                database.deleteById(alarm.id)
            })

            flow.end()
            if (length > 1) {
                return i18n.translate('cancelAlarm.info.confirmAll', {
                    number: length
                })
            } else {
                return i18n.translate('cancelAlarm.info.confirm')
            }
        })
        flow.continue(`${ config.get().assistantPrefix }:No`, (_, flow) => {
            flow.end()
        })

        if (length > 1) {
            return i18n.translate('cancelAlarm.ask.confirmAll', {
                number: length
            })
        } else {
            return i18n.translate('cancelAlarm.ask.confirm')
        }
    }

    // Found alarms by using some of the constrains, no need to continue just cancel
    if (length && (name || recurrence || dateRange)) {
        alarms.forEach(alarm => {
            database.deleteById(alarm.id)
        })

        flow.end()
        if (length > 1) {
            return i18n.translate('cancelAlarm.info.confirmAll', {
                number: length
            })
        } else {
            return i18n.translate('cancelAlarm.info.confirm')
        }
    }

    flow.end()
    return i18n.translate('getAlarm.info.noAlarmFound')
}
