import fs from 'fs'
import path from 'path'
import timestamp from 'time-stamp'
import cron, { ScheduledTask } from 'node-cron'
import { getScheduleString, logger } from '../../utils'
import { 
    InstantTimeSlotValue, 
    Hermes, 
    slotType, 
    Dialog
} from 'hermes-javascript'
import { parseExpression } from 'cron-parser'
import { i18nFactory } from '../../factories'
import { ALARM_CRON_EXP, DIR_DB } from '../../constants'

export type AlarmInit = {
    name: string
    datetime?: Date
    recurrence?: string
}

export type AlarmString = {
    id: string
    name: string
    schedule: string
    rawDatetime: string
    rawRecurrence?: string
    isExpired: boolean
}

/**
 * Reminder
 * 
 * @exception {pastReminderDatetime}
 * @exception {noTaskReminderAlarmFound} 
 */
export class Alarm {
    id: string = ''
    name: string = ''
    schedule: string = ''
    isExpired: boolean = false

    rawDatetime: Date = new Date()
    rawRecurrence: string | null = null
    nextExecution: Date = new Date() 

    taskReminder: ScheduledTask | null = null
    taskReminderAlarm: ScheduledTask | null = null
    
    constructor(obj: AlarmInit | string, hermes: Hermes) {
        if (typeof obj === 'string') {
            this.__constructorLoad(obj, hermes)
        } else if (typeof obj === 'object') {
            this.__constructorCreate(obj, hermes)
        }
    }

    __constructorLoad(rawString: string, hermes: Hermes) {
        const loadData: AlarmString = JSON.parse(rawString)
        
        this.id = loadData.id
        this.name = loadData.name

        this.rawDatetime = new Date(loadData.rawDatetime)
        this.rawRecurrence = loadData.rawRecurrence || null

        this.schedule = loadData.schedule
        this.isExpired = loadData.isExpired

        this.nextExecution = new Date(parseExpression(this.schedule).next().toString())

        if (this.nextExecution.getTime() < Date.now()) {
            this.isExpired = true
        }

        if (!this.isExpired) {
            this.__make_alive(hermes)
        }
    } 

    __constructorCreate(initData: AlarmInit, hermes: Hermes) {
        this.id = timestamp('YYYYMMDD-HHmmss-ms')
        this.name = initData.name

        this.rawDatetime = initData.datetime || new Date()
        this.rawRecurrence = initData.recurrence || null

        this.schedule = getScheduleString(this.rawDatetime, this.rawRecurrence)
        this.isExpired = false

        this.nextExecution = new Date(parseExpression(this.schedule).next().toString())

        if (this.nextExecution.getTime() < Date.now() + 15000) {
            throw new Error('pastReminderDatetime')
        }

        this.__make_alive(hermes)
    }

    /**
     * Create and start cron task
     * 
     * @param hermes 
     */
    __make_alive(hermes: Hermes) {
        const dialogId: string = `snips-assistant:reminder:${this.id}`

        const onReminderArrive = () => {
            const i18n = i18nFactory.get()
            const message = i18n('alarm.info.itsTimeTo', {
                name: this.name
            })

            hermes.dialog().publish('start_session', {
                init: {
                    type: Dialog.enums.initType.action,
                    text: message,
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

        hermes.dialog().sessionFlow(dialogId, (msg, flow) => {
            flow.continue('snips-assistant:Stop', (msg, flow) => {
                flow.end()
            })
            flow.continue('snips-assistant:Silence', (msg, flow) => {
                flow.end()
            })
            flow.continue('snips-assistant:AddTime', (msg, flow) => {
                flow.end()
            })
            //flow.notRecognized()
        })

        this.taskReminderAlarm = cron.schedule(ALARM_CRON_EXP, onReminderArrive, { scheduled: false })
        this.taskReminder = cron.schedule(this.schedule, () => {
            if (this.taskReminderAlarm) {
                this.taskReminderAlarm.start()
            } else {
                throw new Error('noTaskReminderAlarmFound')
            }
        })
    }

    /**
     * Elicit reminder info to string
     */
    toString() {
        return JSON.stringify({
            id: this.id,
            name: this.name,
            schedule: this.schedule,
            rawDatetime: this.rawDatetime.toJSON(),
            rawRecurrence: this.rawRecurrence,
            nextExecution: this.nextExecution,
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
        if (this.taskReminder) {
            this.taskReminder.stop()
            this.taskReminder.destroy()
        }

        if (this.taskReminderAlarm) {
            this.taskReminderAlarm.stop()
            this.taskReminderAlarm.destroy()
        }
    }

    /**
     * Reset alarm, update nextExecution
     */
    reset() {
        if (!this.rawRecurrence) {
            this.setExpired()
        }

        if (this.taskReminderAlarm) {
            this.taskReminderAlarm.stop()
        } else {
            throw new Error('noTaskReminderAlarmFound')
        }
        
        this.nextExecution = new Date(parseExpression(this.schedule).next().toString())
    }

    /**
     * Deactivate reminder, keep the copy saved
     */
    setExpired() {
        if (this.taskReminder) {
            this.taskReminder.stop()
            this.taskReminder.destroy()
            this.taskReminder = null
        }

        if (this.taskReminderAlarm) {
            this.taskReminderAlarm.stop()
            this.taskReminderAlarm.destroy()
            this.taskReminderAlarm = null
        }

        this.isExpired = true
    }

    addTime(duration: number) {
        //reserved
    }

    reschedule(
        newDatetimeSnips?: InstantTimeSlotValue<slotType.instantTime>, 
        newRecurrence?: string
    ) {
        if (!newDatetimeSnips && !newRecurrence) {
            throw new Error('noRescheduleTimeFound')
        }
        // reserved
    }
}
