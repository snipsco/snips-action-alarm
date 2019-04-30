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
        return i18n('getAlarms.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            context: 'name'
        })
    }

    // "I found <number> alarm(s) set for <time>."
    if (!name && dateRange && !recurrence) {
        return i18n('getAlarms.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time,
            context: 'time'
        })
    }

    // "I found <number> alarm(s) set for <recurrence>."
    if (!name && !dateRange && recurrence) {
        return i18n('getAlarms.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            recurrence,
            context: 'recurrence'
        })
    }

    // "I found <number> alarm(s) named <name> and set for <time>."
    if (name && dateRange && !recurrence) {
        return i18n('getAlarms.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            time,
            recurrence: 'time_name'
        })
    }

    // "I found <number> alarm(s) named <name> and set for <recurrence>."
    if (name && !dateRange && recurrence) {
        return i18n('getAlarms.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            recurrence,
            context: 'recurrence_name'
        })
    }

    // "I found <number> alarm(s) set for <recurrence> at <time>."
    if (!name && dateRange && recurrence) {
        return i18n('getAlarms.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time,
            recurrence,
            context: 'time_recurrence'
        })
    }

    // "I found <number> alarm(s) named <name> and set for <recurrence> at <time>."
    if (name && dateRange && recurrence) {
        return i18n('getAlarms.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            time,
            recurrence,
            context: 'time_recurrence_name'
        })
    }

    // "I found <number> alarm(s)."
    return i18n('getAlarms.head.found', {
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
        const alarm = alarms[0]

        if (alarm.name && alarm.recurrence) {
            return i18n('getAlarms.list.singleAlarm', {
                name: alarm.name,
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'recurrence_name'
            })
        } else if (alarm.name && !alarm.recurrence) {
            return i18n('getAlarms.list.singleAlarm', {
                name: alarm.name,
                time: beautifyFct(alarm.date),
                context: 'name'
            })
        } else if (!alarm.name && alarm.recurrence) {
            return i18n('getAlarms.list.singleAlarm', {
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'recurrence'
            })
        }

        return i18n('getAlarms.list.singleAlarm', {
            time: beautifyFct(alarm.date),
            context: 'time'
        })
    } else {
        for (let i = 0; i < alarms.length; i++) {
            const alarm = alarms[i]

            if (alarm.name && alarm.recurrence) {
                tts += i18n('getAlarms.list.scheduled', {
                    name: alarm.name,
                    recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                    context: 'recurrence_name'
                })
            } else if (alarm.name && !alarm.recurrence) {
                tts += i18n('getAlarms.list.scheduled', {
                    name: alarm.name,
                    time: beautifyFct(alarm.date),
                    context: 'name'
                })
            } else if (!alarm.name && alarm.recurrence) {
                tts += i18n('getAlarms.list.scheduled', {
                    recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                    context: 'recurrence'
                })
            } else {
                tts += i18n('getAlarms.list.scheduled', {
                    time: beautifyFct(alarm.date)
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
            return i18n('setAlarm.scheduled', {
                name: alarm.name,
                time: beautify.datetime(alarm.date),
                context: 'name'
            })
        }

        if (!alarm.name && alarm.recurrence) {
            return i18n('setAlarm.info.scheduled', {
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'recurrence'
            })
        }

        if (alarm.name && alarm.recurrence) {
            return i18n('setAlarm.info.scheduled', {
                name: alarm.name,
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'name_recurrence'
            })
        }
        
        return i18n('setAlarm.info.scheduled', {
            time: beautify.datetime(alarm.date)
        })
    }
}
