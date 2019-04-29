import { Alarm, SerializedAlarm } from './alarm'
import { DIR_DB } from '../../constants'
import { DateRange, logger } from '../../utils'
import fs from 'fs'
import path from 'path'
import { Hermes } from 'hermes-javascript'

function isDateInRange(date: Date, dateRange: DateRange) {
    return date >= dateRange.min && date < dateRange.max
}

export class Database {
    alarms: Alarm[] = []
    hermes: Hermes

    constructor(hermes: Hermes) {
        this.hermes = hermes
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

            const data: SerializedAlarm = JSON.parse(fs.readFileSync(pathAbs).toString())
            this.alarms.push(new Alarm(this.hermes,
                new Date(data.date),
                data.recurrence || undefined,
                data.name,
                data.id
            ))
        })
    }

    add(date: Date, recurrence?: string, name?: string): Alarm {
        const alarm = new Alarm(this.hermes, date, recurrence, name)
        alarm.save()
        this.alarms.push(alarm)
        return alarm
    }

    /**
     * Get alarms
     * 
     * @param name 
     * @param range 
     * @param recurrence 
     * @param isExpired 
     */
    get(name?: string, range?: DateRange, recurrence?: string) {
        return this.alarms.filter(alarm =>
            (!name || alarm.name === name) &&
            (!range || isDateInRange(alarm.date, range)) &&
            (!recurrence || alarm.recurrence === recurrence)
        ).sort((a, b) => {
            return (a.date.getTime() - b.date.getTime())
        })
    }

    /**
     * Get an alarm by its id
     * 
     * @param id 
     */
    getById(id: string): Alarm {
        const res = this.alarms.filter(alarm => alarm.id === id)
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
            this.alarms.splice(this.alarms.indexOf(alarm), 1)
            return true
        }

        return false
    }

    /**
     * Delete all alarms
     */
    deleteAll() {
        this.alarms.forEach(alarm => {
            alarm.delete()
        })
        this.alarms.splice(0)
    }

    /**
     * Disable all the alarms and release memory
     */
    destroy() {
        // disable all the alarms (task crons)
        this.alarms.forEach(alarm => {
            alarm.destroy()
        })
    }
}
