import fs from 'fs'
import moment from 'moment'
import 'moment/locale/fr'
import { config, i18n } from 'snips-toolkit'
import { DateRange } from './parser'
import { ASSETS_DIR } from '../constants'

export type DateFormats = {[key: string]: any}

let dateFormats: DateFormats = {}

export const beautify = {
    init: () => {
        dateFormats = JSON.parse(fs.readFileSync(`${ASSETS_DIR}/dates/${ config.get().locale }.json`, 'utf8'))
    },

    date: (date: Date): string => {
        return moment(date).locale(config.get().locale).calendar(undefined, {
            sameDay: dateFormats.moment.date.sameDay,
            nextDay: dateFormats.moment.date.nextDay,
            nextWeek: dateFormats.moment.date.nextWeek,
            sameElse: dateFormats.moment.date.sameElse
        }).replace(' 0', '')
    },

    time: (date: Date): string => {
        return moment(date)
            .locale(config.get().locale)
            .format(dateFormats.moment.time)
            .replace(' 0', '')
    },

    datetime: (date: Date): string => {
        return moment(date).locale(config.get().locale).calendar(undefined, {
            sameDay: dateFormats.moment.datetime.sameDay,
            nextDay: dateFormats.moment.datetime.nextDay,
            nextWeek: dateFormats.moment.datetime.nextWeek,
            sameElse: dateFormats.moment.datetime.sameElse,
        }).replace(' 0', '')
    },

    daterange: (dateRange: DateRange): string => {
        if (dateRange.min.getDay() === 5 && dateRange.max.getDay() === 1) {
            return dateFormats.moment.daterange.weekEnd
        }

        if (dateRange.min.getDay() === 1 && dateRange.max.getDay() === 1) {
            return dateFormats.moment.daterange.nextWeek
        }

        return i18n.translate('daterange.fromTo', {
            date_1: beautify.date(dateRange.min),
            date_2: beautify.date(new Date(dateRange.max.getTime() - 1000))
        })
    },

    recurrence: (date: Date, recurrence: string): string => {
        if (recurrence === 'daily') {
            return dateFormats.moment.recurrence.daily
        }

        return moment(date).locale(config.get().locale).calendar(undefined, {
            sameDay: dateFormats.moment.recurrence.every,
            nextDay: dateFormats.moment.recurrence.every,
            nextWeek: dateFormats.moment.recurrence.every,
            sameElse: dateFormats.moment.recurrence.every,
        }).replace(' 0', '')
    }
}
