import fs from 'fs'
import path from 'path'
import timestamp from 'time-stamp'
import cron, { ScheduledTask } from 'node-cron'
import { getScheduleString, logger } from '../../utils'
import { InstantTimeSlotValue, Hermes, slotType, Dialog } from 'hermes-javascript'
import { parseExpression } from 'cron-parser'
import { i18nFactory } from '../../factories'
import { ALARM_CRON_EXP, DIR_DB } from '../../constants'

export type AlarmInit = {
    date: Date
    recurrence?: string
    name?: string
}

export type AlarmString = {
    id: string
    name: string
    schedule: string
    date: string
    recurrence?: string
    isExpired: boolean
}

/**
 * Alarm
 * 
 * @exception {pastAlarmDatetime}
 * @exception {noTaskAlarmBeepFound} 
 */
export class Alarm {
    id: string = ''

    date: Date = new Date()
    recurrence: string | null = null
    name: string | null = null
    schedule: string = ''
    isExpired: boolean = false
    taskAlarm: ScheduledTask | null = null
    taskAlarmBeep: ScheduledTask | null = null
    
    constructor(obj: AlarmInit | string, hermes: Hermes) {
        if (typeof obj === 'string') {
            const data: AlarmString = JSON.parse(obj)
        
            this.id = data.id
            this.date = new Date(data.date)
            this.recurrence = data.recurrence || null
            this.name = data.name
            this.schedule = data.schedule

            if (this.date < new Date()) {
                if (this.recurrence) {
                    do {
                        this.date = new Date(parseExpression(this.schedule).next().toString())
                    } while (this.date < new Date())
                    this.isExpired = false
                } else {
                    this.isExpired = true
                }
            }

            if (!this.isExpired) {
                this.makeAlive(hermes)
            }
        } else if (typeof obj === 'object') {
            this.id = timestamp('YYYYMMDD-HHmmss-ms')
            this.recurrence = obj.recurrence || null
            this.name = obj.name || null
            this.schedule = getScheduleString(obj.date, this.recurrence)
            this.isExpired = false

            if (this.recurrence) {
                this.date = new Date(parseExpression(this.schedule).next().toString())
            } else {
                this.date = obj.date
            }
    
            if (this.date.getTime() < Date.now() + 15000) {
                throw new Error('pastAlarmDatetime')
            }
    
            this.makeAlive(hermes)
            this.save()
        }
    }

    /**
     * Create and start cron task
     * 
     * @param hermes 
     */
    makeAlive(hermes: Hermes) {
        const dialogId: string = `snips-assistant:alarm:${this.id}`

        const onAlarmArrive = () => {
            const i18n = i18nFactory.get()

            let message: string = ''
            if (this.name) {
                message += i18n('alarm.info.itsTimeTo_Name', {
                    name: this.name
                })
            } else {
                message += i18n('alarm.info.itsTimeTo')
            }

            hermes.dialog().publish('start_session', {
                init: {
                    type: Dialog.enums.initType.action,
                    text: '[[sound:alarm.beep]] ' + message,
                    intentFilter: [
                        'snips-assistant:Stop',
                        'snips-assistant:Silence',
                        'snips-assistant:AddTime'
                    ],
                    canBeEnqueued: false,
                    sendIntentNotRecognized: true
                },
                customData: dialogId,
                siteId: 'default'
            })
        }

        hermes.dialog().sessionFlow(dialogId, (_, flow) => {
            flow.continue('snips-assistant:Stop', (_, flow) => {
                flow.end()
            })
            flow.continue('snips-assistant:Silence', (_, flow) => {
                flow.end()
            })
            flow.continue('snips-assistant:AddTime', (_, flow) => {
                flow.end()
            })
            //flow.notRecognized()
        })

        this.taskAlarmBeep = cron.schedule(ALARM_CRON_EXP, onAlarmArrive, { scheduled: false })
        this.taskAlarm = cron.schedule(this.schedule, () => {
            if (this.taskAlarmBeep) {
                this.taskAlarmBeep.start()
            } else {
                throw new Error('noTaskAlarmBeepFound')
            }
        })
    }

    /**
     * Elicit alarm info to string
     */
    toString() {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            schedule: this.schedule,
            date: this.date.toJSON(),
            recurrence: this.recurrence,
            isExpired: this.isExpired
        })
    }

    /**
     * Save alarm info to fs
     */
    save() {
        fs.writeFile(path.resolve(__dirname + DIR_DB, `${this.id}.json`), this.toString(), 'utf8', (err) => {
            if (err) {
                throw new Error(err.message)
            }
            logger.info(`Saved alarm: ${this.name} - ${this.id}`)
        })
    }

    /**
     * Remove the saved copy from fs
     */
    delete() {
        this.destroy()
        
        fs.unlink(path.resolve(__dirname + DIR_DB, `${this.id}.json`), (err) => {
            if (err) {
                throw new Error(err.message)
            }
            logger.info(`Deleted alarm: ${this.name} - ${this.id}`)
        })
    }

    /**
     * Destroy all the task cron, release memory
     */
    destroy() {
        if (this.taskAlarm) {
            this.taskAlarm.stop()
            this.taskAlarm.destroy()
        }

        if (this.taskAlarmBeep) {
            this.taskAlarmBeep.stop()
            this.taskAlarmBeep.destroy()
        }
    }

    /**
     * Reset alarm, update next execution date
     */
    reset() {
        if (!this.recurrence) {
            this.setExpired()
        }

        if (this.taskAlarmBeep) {
            this.taskAlarmBeep.stop()
        } else {
            throw new Error('noTaskAlarmBeepFound')
        }
        
        this.date = new Date(parseExpression(this.schedule).next().toString())
    }

    /**
     * Desactivate alarm, keep the copy saved
     */
    setExpired() {
        if (this.taskAlarm) {
            this.taskAlarm.stop()
            this.taskAlarm.destroy()
            this.taskAlarm = null
        }

        if (this.taskAlarmBeep) {
            this.taskAlarmBeep.stop()
            this.taskAlarmBeep.destroy()
            this.taskAlarmBeep = null
        }

        this.isExpired = true
    }

    reschedule(
        newDatetimeSnips?: InstantTimeSlotValue<slotType.instantTime>, 
        newRecurrence?: string
    ) {
        if (!newDatetimeSnips && !newRecurrence) {
            throw new Error('noRescheduleTimeFound')
        }
    }
}
