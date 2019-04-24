import { logger, translation, beautify, slot, Database } from '../utils'
import handlers, { Handler } from './index'
import { Hermes } from 'hermes-javascript'
import commonHandler, { KnownSlots } from './common'
import { Alarm, AlarmInit } from '../utils/alarm'

export const getAlarmHandler: Handler = async function (msg, flow, hermes: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('GetAlarm')

    const {
        name,
        recurrence,
        date
    } = await commonHandler(msg, knownSlots)

    // Required slot: name
    if ((!name || slot.missing(name)) && (recurrence || date)) {
        throw new Error('intentNotRecognized')
    }

    // Required slot: datetime or recurrence
    if (name && !(recurrence || date)) {
        throw new Error('intentNotRecognized')
    }

    // Required slot: name, datetime/recurrence
    if (!name && !(recurrence || date)) {
        flow.continue('snips-assistant:SetAlarm', (msg, flow) => {
            if (knownSlots.depth) {
                knownSlots.depth -= 1
            }
            return handlers.setAlarm(msg, flow, hermes, database, knownSlots)
        })

        return translation.randomTranslation('setAlarm.info.nameAndTime')
    }

    const alarmInitObj: AlarmInit = {
        name: name || '',
        datetime: date || undefined,
        recurrence: recurrence || undefined 
    }
    
    const alarm: Alarm = database.add(alarmInitObj)
    
    flow.end()
    return translation.randomTranslation('setAlarm.info.alarm_SetFor_', {
        name: alarm.name,
        time: beautify.datetime(alarm.nextExecution)
    })
}
