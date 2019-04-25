import cron from 'node-cron'
import { InstantTimeSlotValue, slotType, grain } from 'hermes-javascript'
import { logger } from './logger'

export type DateRange = {
    min: Date
    max: Date
}

export const getDateRange = (date: Date, grainValue: string): DateRange => {
    switch (grainValue) {
        case grain.minute:
            return { min: date, max: new Date(date.getTime() + 1000 * 60) }
        case grain.hour:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60) }
        case grain.day:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24) }
        case grain.week:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24 * 7) }
        case grain.month:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24 * 30) }
        case grain.year:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24 * 365) }
        default:
            // Not sure which will be this case, Second? Quarter?
            return { min: date, max: new Date(date.getTime() + 1000 * 60) }
    }
}

/**
 * Convert a incompleted datetime to a exact time, filling the unclear parts by current time sub-segments
 */
 export const getCompletedDatetime = (dateSlot: InstantTimeSlotValue<slotType.instantTime>): Date => {
     const datetimeNow = new Date(Date.now())
     let completedDatetime = new Date(dateSlot.value)

     switch (dateSlot.grain) {
         case 'Minute':// base: exact at YYYY-MM-DD HH-MM
             return completedDatetime
         // case 'Hour':// base: the next hour at HH:00
         //     completedDatetime.setMinutes(datetimeNow.getMinutes())
         //     return completedDatetime
         case 'Day':// base: the next day at 00:00
             completedDatetime.setHours(datetimeNow.getHours())
             completedDatetime.setMinutes(datetimeNow.getMinutes())
             return completedDatetime
         case 'Week':// base: the first day of next weeek at 00:00
             completedDatetime.setDate(completedDatetime.getDate() + datetimeNow.getDay() - 1)
             completedDatetime.setHours(datetimeNow.getHours())
             completedDatetime.setMinutes(datetimeNow.getMinutes())
             return completedDatetime
         case 'Month':// base: the first day of month at 00:00
             completedDatetime.setDate(datetimeNow.getDate())
             completedDatetime.setHours(datetimeNow.getHours())
             completedDatetime.setMinutes(datetimeNow.getMinutes())
             return completedDatetime
         case 'Year':// base: the first day of year at 00:00
             completedDatetime.setMonth(datetimeNow.getMonth())
             completedDatetime.setDate(datetimeNow.getDate())
             completedDatetime.setHours(datetimeNow.getHours())
             completedDatetime.setMinutes(datetimeNow.getMinutes())
             return completedDatetime
         default:// base: exact at YYYY-MM-DD HH-MM-SS
             return completedDatetime
     }
 }

/**
 * Convert a datetime and recurrence to a cron schedule expression
 *
 *     ┌────────────── second
 *     │ ┌──────────── minute
 *     │ │ ┌────────── hour
 *     │ │ │ ┌──────── day of month
 *     │ │ │ │ ┌────── month
 *     │ │ │ │ │ ┌──── day of week
 *     │ │ │ │ │ │
 *     │ │ │ │ │ │
 *     * * * * * *
 */
export const getScheduleString = (datetime: Date, recurrence: string | null): string => {
    logger.debug('getScheduleString', typeof datetime)
    const mapper = {
        mondays: '* * Mon',
        tuesdays: '* * Tue',
        wednesdays: '* * Wed',
        thursdays: '* * Thu',
        fridays: '* * Fri',
        saturdays: '* * Sat',
        sundays: '* * Sun',
        weekly: `* * ${datetime.getDay()}`,
        daily: '* * *',
        monthly: `${datetime.getDate()} * *`,
        weekends: '* * Sat,Sun'
    }

    let schedule = `${datetime.getSeconds()} ${datetime.getMinutes()} ${datetime.getHours()} `

    if (recurrence) {
        for (let [key, value] of Object.entries(mapper)) {
            if (recurrence.toLowerCase().includes(key)) {
                schedule += value
            }
        }
    } else {
        schedule += `${datetime.getDate()} ${datetime.getMonth()+1} ${datetime.getDay()}`
    }

    logger.debug(schedule)

    if (!cron.validate(schedule)) {
        throw 'invalidCronScheduleExpression'
    }

    return schedule
}
