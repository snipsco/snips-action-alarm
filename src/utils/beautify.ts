import { configFactory, i18nFactory } from '../factories'
import { LANGUAGE_MAPPINGS } from '../constants'
import moment from 'moment'
import 'moment/locale/fr'
import { DateRange } from './parser';

export const beautify = {
    date: (date: Date): string => {
        const i18n = i18nFactory.get()
        const config = configFactory.get()
        const language = LANGUAGE_MAPPINGS[config.locale]

        return moment(date).locale(language).calendar(undefined, {
            sameDay: i18n('moment.date.sameDay'),
            nextDay: i18n('moment.date.nextDay'),
            nextWeek: i18n('moment.date.nextWeek'),
            sameElse: i18n('moment.date.sameElse'),
        }).replace(' 0', '')
    },

    time: (date: Date): string => {
        const i18n = i18nFactory.get()
        const config = configFactory.get()
        const language = LANGUAGE_MAPPINGS[config.locale]

        return moment(date)
            .locale(language)
            .format(i18n('moment.time'))
            .replace(' 0', '')
    },

    datetime: (date: Date): string => {
        const i18n = i18nFactory.get()
        const config = configFactory.get()
        const language = LANGUAGE_MAPPINGS[config.locale]

        return moment(date).locale(language).calendar(undefined, {
            sameDay: i18n('moment.datetime.sameDay'),
            nextDay: i18n('moment.datetime.nextDay'),
            nextWeek: i18n('moment.datetime.nextWeek'),
            sameElse: i18n('moment.datetime.sameElse'),
        }).replace(' 0', '')
    },

    daterange: (dateRange: DateRange): string => {
        const i18n = i18nFactory.get()

        if (dateRange.min.getDay() === 5 && dateRange.max.getDay() === 1) {
            return i18n('moment.daterange.weekEnd')
        }

        if (dateRange.min.getDay() === 1 && dateRange.max.getDay() === 1) {
            return i18n('moment.daterange.nextWeek')
        }

        return i18n('moment.daterange.fromTo', {
            date_1: beautify.date(dateRange.min),
            date_2: beautify.date(new Date(dateRange.max.getTime() - 1000))
        })
    },

    recurrence: (dateRange: DateRange, recurrence: string): string => {
        const i18n = i18nFactory.get()
        const config = configFactory.get()
        const language = LANGUAGE_MAPPINGS[config.locale]

        return ''
    }
}
