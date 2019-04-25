import { logger, translation, Database } from '../utils'
import handlers, { Handler } from './index'
import { Hermes } from 'hermes-javascript'
import commonHandler, { KnownSlots } from './common'
import { Alarm, AlarmInit } from '../utils/alarm'

export const setAlarmHandler: Handler = async function (msg, flow, hermes: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('SetAlarm')

    const {
        name,
        recurrence,
        date
    } = await commonHandler(msg, knownSlots)

    // Required slot: datetime/recurrence
    //TODO: elicitation
    if (!(recurrence || date)) {
        flow.continue('snips-assistant:SetAlarm', (msg, flow) => {
            if (knownSlots.depth) {
                knownSlots.depth -= 1
            }
            return handlers.setAlarm(msg, flow, hermes, database, knownSlots)
        })
        
        return translation.randomTranslation('setAlarm.info.nameAndTime')
    }
    
    const alarmInitObj: AlarmInit = {
        name: name || undefined,
        date: date || undefined,
        recurrence: recurrence || undefined 
    }
    
    const alarm: Alarm = database.add(alarmInitObj)
    
    flow.end()
    return translation.setAlarmToSpeech(alarm)
}
