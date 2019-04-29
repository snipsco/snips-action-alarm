import { i18nFactory } from '../factories/i18nFactory'
import { Alarm } from './alarm'
import { beautify } from './beautify'
import { DateRange } from './parser'

function getHead(alarms: Alarm[], name?: string, dateRange?: DateRange, recurrence?: string): string {
    function getFormat(dateRange?: DateRange): string {
        if (dateRange) {
            if (dateRange.grain) {
                if (dateRange.grain === 'Day') {
                    return 'date'
                }
                if (dateRange.grain === 'Week') {
                    return 'daterange'
                }
                return 'datetime'
            } else {
                return 'daterange'
            }
        }
    
        return ''
    }
    
    const i18n = i18nFactory.get()

    let time: string = ''
    if (dateRange) {
        switch (getFormat(dateRange)) {
            case 'datetime':
                time = beautify.datetime(dateRange.min)
                break
            case 'daterange':
                time = beautify.daterange(dateRange)
                break
            case 'date':
                time = beautify.date(dateRange.min)
                break
            default:
                time = beautify.datetime(dateRange.min)
        }
    }

    // "I found <number> alarm(s) named <name>."
    if (name && !dateRange && !recurrence) {
        return i18n('getAlarms.head.found_AlarmsNamed_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name
        })
    }

    // "I found <number> alarm(s) set for <time>."
    if (!name && dateRange && !recurrence) {
        return i18n('getAlarms.head.found_AlarmsSetFor_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time
        })
    }

    // "I found <number> alarm(s) named <name> and set for <time>."
    if (name && dateRange && !recurrence) {
        return i18n('getAlarms.head.found_AlarmsNamed_AndSetFor_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            time
        })
    }

    // "I found <number> alarm(s) named <name> and set for <recurrence>."
    if (name && !dateRange && recurrence) {
        return i18n('getAlarms.head.found_AlarmsNamed_AndSetForEvery_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            recurrence
        })
    }

    // "I found <number> alarm(s) set for <recurrence> at <time>."
    if (!name && dateRange && recurrence) {
        return i18n('getAlarms.head.found_AlarmsSetForEveryAt_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time,
            recurrence
        })
    }

    // "I found <number> alarm(s) named <name> and set for <recurrence> at <time>."
    if (name && dateRange && recurrence) {
        return i18n('getAlarms.head.found_AlarmsNamed_AndSetForEveryAt_', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            time,
            recurrence
        })
    }

    // "I found <number> alarm(s)."
    return i18n('getAlarms.head.found_Alarms', {
        number: alarms.length,
        odd: alarms.length > 1 ? 's' : ''
    })
}

// "<name> set for <time>."
function getList(alarms: Alarm[], dateRange?: DateRange): string {
    const i18n = i18nFactory.get()
    let tts: string = ''

    const beautifyFct = (dateRange && dateRange.grain === 'Day') ? beautify.time : beautify.datetime

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

    getAlarmsToSpeech(alarms: Alarm[], name?: string, dateRange?: DateRange, recurrence?: string): string {
        let tts: string = ''

        tts += getHead(alarms, name, dateRange, recurrence)
        
        if (alarms.length > 0) {
            tts += ' '
            tts += getList(alarms, dateRange)
        }

        return tts
    },

    setAlarmToSpeech(alarm: Alarm): string {
        const i18n = i18nFactory.get()

        if (alarm.name && !alarm.recurrence) {
            return i18n('setAlarm.info.alarm_SetFor_Name', {
                name: alarm.name,
                time: beautify.datetime(alarm.date)
            })
        }

        if (!alarm.name && alarm.recurrence) {
            return i18n('setAlarm.info.alarm_SetFor_Every', {
                name: alarm.name,
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence)
            })
        }
        
        return i18n('setAlarm.info.alarm_SetFor', {
            time: beautify.datetime(alarm.date)
        })
    }
}
