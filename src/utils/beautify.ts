import { configFactory, i18nFactory } from '../factories'
import { LANGUAGE_MAPPINGS } from '../constants'
import moment from 'moment'
import 'moment/locale/fr'

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
            .format(i18n('moment.time.12H'))
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
}
