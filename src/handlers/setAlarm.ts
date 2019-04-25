import { logger, translation, Database } from '../utils'
import { Handler } from './index'
import { Hermes } from 'hermes-javascript'
import commonHandler, { KnownSlots } from './common'
import { Alarm, AlarmInit } from '../utils/alarm'

export const setAlarmHandler: Handler = async function (msg, flow, hermes: Hermes, database: Database, knownSlots: KnownSlots = { depth: 2 }) {
    logger.info('SetAlarm')

    const {
        name,
        date,
        recurrence
    } = await commonHandler(msg, knownSlots)

    if (!date) {
        throw new Error('intentNotRecognized')
    }
    
    // attributes can be undefined
    const alarmInitObj: AlarmInit = {
        date,
        recurrence,
        name
    }
    
    const alarm: Alarm = database.add(alarmInitObj)
    
    flow.end()
    return translation.setAlarmToSpeech(alarm)
}
