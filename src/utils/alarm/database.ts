import { Alarm, AlarmInit } from './alarm'
import { DIR_DB } from '../../constants'
import { DatetimeRange, logger } from '../../utils'
import fs from 'fs'
import path from 'path'
import { Hermes } from 'hermes-javascript'

function isDateInRange(datetimeRange: DatetimeRange, datetimeObj: Date) {
    return datetimeObj.getTime() >= datetimeRange.min && datetimeObj.getTime() < datetimeRange.max
}

export class Database {
    // Save all the alarms
    __alarms: Alarm[] = []

    // Save the hermes client
    __hermesClient: Hermes

    constructor(hermes: Hermes) {
        this.__hermesClient = hermes
        this.loadSavedAlarms()
    }

    /**
     * Load from file system
     */
    loadSavedAlarms() {
        const savedIds: string[] = fs.readdirSync(path.resolve(__dirname + DIR_DB))
        logger.info(`Found ${savedIds.length} saved alarms!`)

        savedIds.forEach(id => {
            const pathAbs = path.resolve(__dirname + DIR_DB, id)
            logger.debug('Reading: ', pathAbs)

            const alarmRawString = fs.readFileSync(pathAbs).toString()

            const alarm = new Alarm(alarmRawString, this.__hermesClient)
            this.__alarms.push(alarm)
        })
    }

    add(alarmInitObj: AlarmInit): Alarm {
        const alarm = new Alarm(alarmInitObj, this.__hermesClient)
        this.__alarms.push(alarm)
        return alarm
    }

    /**
     * Get alarms
     * 
     * @param name 
     * @param datetime 
     * @param recurrence 
     * @param isExpired 
     */
    get(name?: string, datetimeRange?: DatetimeRange, recurrence?: string, isExpired?: boolean) {
        return this.__alarms.filter(alarm =>
            (!name || name === alarm.name) &&
            (!datetimeRange || isDateInRange(datetimeRange, alarm.rawDatetime)) &&
            (!recurrence || recurrence === alarm.rawRecurrence) &&
            (isExpired === alarm.isExpired)
        ).sort( (a, b) => {
            return (a.rawDatetime.getTime() - b.rawDatetime.getTime())
        })
    }

    /**
     * Get an alarm by its id
     * 
     * @param id 
     */
    getById(id: string): Alarm {
        const res = this.__alarms.filter(alarm => alarm.id === id)
        if (res.length === 0) {
            throw new Error('canNotFindAlarm')
        }
        return res[0]
    }

    /**
     * Delete an existing alarm from database
     * 
     * @param id 
     */
    deleteById(id: string): boolean {
        const alarm = this.getById(id)
        if (alarm) {
            alarm.delete()
            this.__alarms.splice(this.__alarms.indexOf(alarm), 1)
            return true
        }

        return false
    }

    /**
     * Delete all alarms
     */
    deleteAll() {
        this.__alarms.forEach(alarm => {
            alarm.delete()
        })
        this.__alarms.splice(0)
    }

    /**
     * Disable all the alarms and release memory
     */
    destroy() {
        // disable all the alarms (task crons)
        this.__alarms.forEach(alarm => {
            alarm.destroy()
        })
    }
}
