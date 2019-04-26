import { i18nFactory } from '../factories/i18nFactory'
import { Alarm } from './alarm'
import { beautify } from './beautify'

function getHead(alarms: Alarm[], name?: string, date?: Date, grain?: string, recurrence?: string): string {
    const i18n = i18nFactory.get()

    const beautifyFct = (grain && (grain === 'Hour' || grain === 'Minute')) ? beautify.datetime : beautify.date

    // "I found <number> alarm(s) named <name>."
    if (name && !date && !recurrence) {
        return i18n('getAlarms.head.found_AlarmsNamed_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name
        })
    }

    // "I found <number> alarm(s) set for <time>."
    if (!name && date && !recurrence) {
        return i18n('getAlarms.head.found_AlarmsSetFor_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time: beautifyFct(date)
        })
    }

    // "I found <number> alarm(s) set for every <recurrence>."
    if (!name && !date && recurrence) {
        return i18n('getAlarms.head.found_AlarmsSetForEvery_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : ''
            //recurrence: getRecurrenceHuman(alarm.recurrence)
        })
    }

    // "I found <number> alarm(s) named <name> and set for <time>."
    if (name && date && !recurrence) {
        return i18n('getAlarms.head.found_AlarmsNamed_AndSetFor_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            time: beautifyFct(date)
        })
    }

    // "I found <number> alarm(s) named <name> and set for <recurrence>."
    if (name && date && recurrence) {
        return i18n('getAlarms.head.found_AlarmsNamed_AndSetForEvery_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name
            //recurence: getRecurrenceHuman(alarm.recurrence)
        })
    }

    // "I found <number> alarm(s)."
    if (!name && !date && !recurrence) {
        return i18n('getAlarms.head.found_Alarms', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : ''
        })
    }

    return ''
}

// "<name> set for <time>."
function getList(alarms: Alarm[], date?: Date): string {
    const i18n = i18nFactory.get()
    let tts: string = ''

    const beautifyFct = (date) ? beautify.time : beautify.datetime


    if (alarms.length === 1) {
        tts += i18n('getAlarms.list.singleAlarm_SetFor_', {
            time: beautifyFct(alarms[0].date)
        })
    } else {
        for (let i = 0; i < alarms.length; i++) {
            if (alarms[i].name) {
                tts += i18n('getAlarms.list.alarm_SetFor_Name', {
                    name: alarms[i].name,
                    time: beautifyFct(alarms[i].date)
                })
            } else {
                tts += i18n('getAlarms.list.alarm_SetFor_', {
                    time: beautifyFct(alarms[i].date)
                })
            }
            
            tts += ' '
        }
    }

    return tts
}

// "The most recent one is: <name> set for <time>."
function getRecent(alarms: Alarm[]): string {
    const i18n = i18nFactory.get()

    let messageHead = i18n('getAlarms.info.theMostRecentIs')
    let messageContent = i18n('getAlarms.info.alarm_SetFor_', {
        name: alarms[0].name,
        time: beautify.date(alarms[0].date)
    })

    return alarms.length === 1 ? messageContent : messageHead + messageContent
}

// "The remaining alarm(s) are: <name> set for <time>."
function getRemaining(alarms: Alarm[]): string {
    const i18n = i18nFactory.get()
    let message = ''

    message += i18n('getAlarms.info.theRemainingAlarmsAre', {
        odd: alarms.length > 2 ? 's' : '',
        be: alarms.length > 2 ? 'are' : 'is'
    })
    for (let i = 1; i < alarms.length; i++) {
        message += i18n('getAlarms.info.alarm_SetFor_', {
            name: alarms[i].name,
            time: beautify.date(alarms[i].date)
        })
    }

    return alarms.length > 1 ? message : ''
}

export const translation = {
    // Outputs an error message based on the error object, or a default message if not found.
    errorMessage: async (error: Error): Promise<string> => {
        let i18n = i18nFactory.get()

        if (!i18n) {
            await i18nFactory.init()
            i18n = i18nFactory.get()
        }

        if (i18n) {
            return i18n([`error.${error.message}`, 'error.unspecific'])
        } else {
            return 'Oops, something went wrong.'
        }
    },

    // Takes an array from the i18n and returns a random item.
    randomTranslation(key: string | string[], opts: {[key: string]: any} = {}): string {
        const i18n = i18nFactory.get()
        const possibleValues = i18n(key, { returnObjects: true, ...opts })

        if (typeof possibleValues === 'string')
            return possibleValues
        
        const randomIndex = Math.floor(Math.random() * possibleValues.length)
        return possibleValues[randomIndex]
    },

    getAlarmsToSpeech(alarms: Alarm[], name?: string, date?: Date, grain?: string, recurrence?: string): string {
        const i18n = i18nFactory.get()

        let tts: string = ''

        tts += getHead(alarms, name, date, grain, recurrence)
        
        if (alarms.length > 0) {
            tts += ' '
            tts += getList(alarms, date)
        }

        return tts
    },

    setAlarmToSpeech(alarm: Alarm): string {
        if (alarm.name) {
            return translation.randomTranslation('setAlarm.info.alarm_SetFor_Name', {
                name: alarm.name,
                time: beautify.datetime(alarm.nextExecution)
            })
        } else {
            return translation.randomTranslation('setAlarm.info.alarm_SetFor', {
                time: beautify.datetime(alarm.nextExecution)
            })
        }
    }
}
