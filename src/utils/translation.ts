import { i18nFactory } from '../factories/i18nFactory'
import { Alarm } from './alarm'
import { beautify } from './beautify'

type AlarmsReport = {
    head: string,
    recent: string,
    remaining: string,
    all: string
}

function getHead(alarms: Alarm[]): string {
    const i18n = i18nFactory.get()
    const alarm = alarms[0]

    // "I have found <number> alarm(s) named <name>."
    if (alarm.name && !alarm.date && !alarm.recurrence) {
        return i18n('getAlarms.info.found_AlarmsNamed_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name: alarm.name
        })
    }

    // "I have found <number> alarm(s) set for <time>."
    if (!alarm.name && alarm.date && !alarm.recurrence) {
        return i18n('getAlarms.info.found_AlarmsSetFor_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time: beautify.date(alarm.date)
        })
    }

    // "I have found <number> alarm(s) set for every <recurrence>."
    if (!alarm.name && !alarm.date && alarm.recurrence) {
        return i18n('getAlarms.info.found_AlarmsSetForEvery_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : ''
            //recurrence: getRecurrenceHuman(alarm.recurrence)
        })
    }

    // "I have found <number> alarm(s) named <name> and set for <time>."
    if (alarm.name && alarm.date && !alarm.recurrence) {
        return i18n('getAlarms.info.found_AlarmsNamed_AndSetFor_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name: alarm.name,
            time: beautify.date(alarm.date)
        })
    }

    // "I have found <number> alarm(s) named <name> and set for <recurrence>."
    if (alarm.name && alarm.date && alarm.recurrence) {
        return i18n('getAlarms.info.found_AlarmsNamed_AndSetForEvery_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name: alarm.name
            //recurence: getRecurrenceHuman(alarm.recurrence)
        })
    }

    // "I have found <number> alarm(s)."
    if (!alarm.name && !alarm.date && !alarm.recurrence) {
        return i18n('getAlarms.info.found_Alarms', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : ''
        })
    }

    return ''
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

// "<name> set for <time>."
function getAll(alarms: Alarm[]): string {
    const i18n = i18nFactory.get()
    let tts: string = ''

    for (let i = 0; i < alarms.length; i++) {
        if (alarms[i].name) {
            tts += i18n('getAlarms.info.alarm_SetFor_Name', {
                name: alarms[i].name,
                time: beautify.datetime(alarms[i].date)
            })
        } else {
            tts += i18n('getAlarms.info.alarm_SetFor_', {
                time: beautify.datetime(alarms[i].date)
            })
        }
        
        tts += ' '
    }

    return tts
}

function buildAlarmsReport(alarms: Alarm[]): AlarmsReport {
    return {
        head: getHead(alarms),
        recent: getRecent(alarms),
        remaining: getRemaining(alarms),
        all: getAll(alarms)
    }
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

    getAlarmsToSpeech(alarms: Alarm[]): string {
        const i18n = i18nFactory.get()

        let tts: string = ''

        if (alarms.length === 0) {
            tts += i18n('getAlarms.info.noAlarmFound')
        } else {
            const alarmsReport = buildAlarmsReport(alarms)
            tts += alarmsReport.head + ' ' + alarmsReport.all
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
