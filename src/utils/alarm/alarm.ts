import fs from 'fs'
import path from 'path'
import timestamp from 'time-stamp'
import cron, { ScheduledTask } from 'node-cron'
import { getScheduleString, logger } from '../../utils'
import { InstantTimeSlotValue, Hermes, slotType, Dialog } from 'hermes-javascript'
import { parseExpression } from 'cron-parser'
import { i18nFactory } from '../../factories'
import { ALARM_CRON_EXP, DIR_DB } from '../../constants'

export type SerializedAlarm = {
    id: string
    name: string
    schedule: string
    date: string
    recurrence?: string
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
    taskAlarm: ScheduledTask | null = null
    taskAlarmBeep: ScheduledTask | null = null
    
    constructor(hermes: Hermes, date: Date, recurrence?: string, name?: string) {
        this.id = timestamp('YYYYMMDD-HHmmss-ms')
        this.recurrence = recurrence || null
        this.name = name || null
        this.schedule = getScheduleString(date, this.recurrence)

        if (this.recurrence) {
            this.date = new Date(parseExpression(this.schedule).next().toString())
        } else {
            this.date = date
        }

        if (this.date < new Date()) {
            if (this.recurrence) {
                do {
                    this.date = new Date(parseExpression(this.schedule).next().toString())
                } while (this.date < new Date())
            } else {
                throw new Error('pastAlarmDatetime')
            }
        }

        this.makeAlive(hermes)
    }

    /**
     * Create and start cron task
     * 
     * @param hermes 
     */
    makeAlive(hermes: Hermes) {
        const dialogId: string = `snips-assistant:alarm:${this.id}`

        const onExpiration = () => {
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

        this.taskAlarmBeep = cron.schedule(ALARM_CRON_EXP, onExpiration, { scheduled: false })
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
            recurrence: this.recurrence
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
            logger.info(`Saved alarm: ${this.id}`)
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
            logger.info(`Deleted alarm: ${this.id}`)
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
