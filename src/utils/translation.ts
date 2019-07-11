import { i18n } from 'snips-toolkit'
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
        return i18n.translate('getAlarm.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            context: 'name'
        })
    }

    // "I found <number> alarm(s) set for <time>."
    if (!name && dateRange && !recurrence) {
        return i18n.translate('getAlarm.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time,
            context: 'time'
        })
    }

    // "I found <number> alarm(s) set for <recurrence>."
    if (!name && !dateRange && recurrence) {
        return i18n.translate('getAlarm.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            recurrence,
            context: 'recurrence'
        })
    }

    // "I found <number> alarm(s) named <name> and set for <time>."
    if (name && dateRange && !recurrence) {
        return i18n.translate('getAlarm.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            time,
            recurrence: 'time_name'
        })
    }

    // "I found <number> alarm(s) named <name> and set for <recurrence>."
    if (name && !dateRange && recurrence) {
        return i18n.translate('getAlarm.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            recurrence,
            context: 'recurrence_name'
        })
    }

    // "I found <number> alarm(s) set for <recurrence> at <time>."
    if (!name && dateRange && recurrence) {
        return i18n.translate('getAlarm.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            time,
            recurrence,
            context: 'time_recurrence'
        })
    }

    // "I found <number> alarm(s) named <name> and set for <recurrence> at <time>."
    if (name && dateRange && recurrence) {
        return i18n.translate('getAlarm.head.found', {
            number: alarms.length,
            odd: alarms.length > 1 ? 's' : '',
            name,
            time,
            recurrence,
            context: 'time_recurrence_name'
        })
    }

    // "I found <number> alarm(s)."
    return i18n.translate('getAlarm.head.found', {
        number: alarms.length,
        odd: alarms.length > 1 ? 's' : ''
    })
}

// "<name> set for <time>."
function getList(alarms: Alarm[], dateRange?: DateRange): string {
    let tts: string = ''

    const beautifyFct = (dateRange && dateRange.grain === 'Day') ? beautify.time : beautify.datetime

    if (alarms.length === 1) {
        const alarm = alarms[0]

        if (alarm.name && alarm.recurrence) {
            return i18n.translate('getAlarm.list.singleAlarm', {
                name: alarm.name,
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'recurrence_name'
            })
        } else if (alarm.name && !alarm.recurrence) {
            return i18n.translate('getAlarm.list.singleAlarm', {
                name: alarm.name,
                time: beautifyFct(alarm.date),
                context: 'name'
            })
        } else if (!alarm.name && alarm.recurrence) {
            return i18n.translate('getAlarm.list.singleAlarm', {
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'recurrence'
            })
        }

        return i18n.translate('getAlarm.list.singleAlarm', {
            time: beautifyFct(alarm.date),
            context: 'time'
        })
    } else {
        for (let i = 0; i < alarms.length; i++) {
            const alarm = alarms[i]

            if (alarm.name && alarm.recurrence) {
                tts += i18n.translate('getAlarm.list.scheduled', {
                    name: alarm.name,
                    recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                    context: 'recurrence_name'
                })
            } else if (alarm.name && !alarm.recurrence) {
                tts += i18n.translate('getAlarm.list.scheduled', {
                    name: alarm.name,
                    time: beautifyFct(alarm.date),
                    context: 'name'
                })
            } else if (!alarm.name && alarm.recurrence) {
                tts += i18n.translate('getAlarm.list.scheduled', {
                    recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                    context: 'recurrence'
                })
            } else {
                tts += i18n.translate('getAlarm.list.scheduled', {
                    time: beautifyFct(alarm.date)
                })
            }

            tts += ' '
        }
    }

    return tts
}

export const translation = {
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
        if (alarm.name && !alarm.recurrence) {
            return i18n.translate('setAlarm.info.scheduled', {
                name: alarm.name,
                time: beautify.datetime(alarm.date),
                context: 'name'
            })
        }

        if (!alarm.name && alarm.recurrence) {
            return i18n.translate('setAlarm.info.scheduled', {
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'recurrence'
            })
        }

        if (alarm.name && alarm.recurrence) {
            return i18n.translate('setAlarm.info.scheduled', {
                name: alarm.name,
                recurrence: beautify.recurrence(alarm.date, alarm.recurrence),
                context: 'name_recurrence'
            })
        }

        return i18n.translate('setAlarm.info.scheduled', {
            time: beautify.datetime(alarm.date)
        })
    }
}
