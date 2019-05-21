import { config, i18n } from 'snips-toolkit'
import moment from 'moment'
import 'moment/locale/fr'
import { DateRange } from './parser'

export const beautify = {
    date: (date: Date): string => {
        return moment(date).locale(config.get().locale).calendar(undefined, {
            sameDay: i18n.translate('moment.date.sameDay'),
            nextDay: i18n.translate('moment.date.nextDay'),
            nextWeek: i18n.translate('moment.date.nextWeek'),
            sameElse: i18n.translate('moment.date.sameElse'),
        }).replace(' 0', '')
    },

    time: (date: Date): string => {
        return moment(date)
            .locale(config.get().locale)
            .format(i18n.translate('moment.time'))
            .replace(' 0', '')
    },

    datetime: (date: Date): string => {
        return moment(date).locale(config.get().locale).calendar(undefined, {
            sameDay: i18n.translate('moment.datetime.sameDay'),
            nextDay: i18n.translate('moment.datetime.nextDay'),
            nextWeek: i18n.translate('moment.datetime.nextWeek'),
            sameElse: i18n.translate('moment.datetime.sameElse'),
        }).replace(' 0', '')
    },

    daterange: (dateRange: DateRange): string => {
        if (dateRange.min.getDay() === 5 && dateRange.max.getDay() === 1) {
            return i18n.translate('moment.daterange.weekEnd')
        }

        if (dateRange.min.getDay() === 1 && dateRange.max.getDay() === 1) {
            return i18n.translate('moment.daterange.nextWeek')
        }

        return i18n.translate('moment.daterange.fromTo', {
            date_1: beautify.date(dateRange.min),
            date_2: beautify.date(new Date(dateRange.max.getTime() - 1000))
        })
    },

    recurrence: (date: Date, recurrence: string): string => {
        if (recurrence === 'daily') {
            return i18n.translate('moment.recurrence.daily')
        }

        return moment(date).locale(config.get().locale).calendar(undefined, {
            sameDay: i18n.translate('moment.recurrence.every'),
            nextDay: i18n.translate('moment.recurrence.every'),
            nextWeek: i18n.translate('moment.recurrence.every'),
            sameElse: i18n.translate('moment.recurrence.every'),
        }).replace(' 0', '')
    }
}
