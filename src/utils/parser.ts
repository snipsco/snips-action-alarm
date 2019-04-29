import cron from 'node-cron'
import { InstantTimeSlotValue, slotType, grain } from 'hermes-javascript'
import { logger } from './logger'

export type DateGrain = {
    date: Date
    grain?: string
}

export type DateRange = {
    min: Date
    max: Date
    grain?: string
}

export const getDateRange = (date: Date, grainValue: string): DateRange => {
    switch (grainValue) {
        case grain.minute:
            return { min: date, max: new Date(date.getTime() + 1000 * 60), grain: grainValue }
        case grain.hour:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60), grain: grainValue }
        case grain.day:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24), grain: grainValue }
        case grain.week:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24 * 7), grain: grainValue }
        case grain.month:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24 * 30), grain: grainValue}
        case grain.year:
            return { min: date, max: new Date(date.getTime() + 1000 * 60 * 60 * 24 * 365), grain: grainValue }
        default:
            // Not sure which will be this case, Second? Quarter?
            return { min: date, max: new Date(date.getTime() + 1000 * 60) }
    }
}

/**
 * Convert a incompleted date to a exact time, filling the unclear parts by current time sub-segments
 */
export const getExactDate = (dateSlot: InstantTimeSlotValue<slotType.instantTime>): Date => {
    const now = new Date(Date.now())
    let date = new Date(dateSlot.value)

    switch (dateSlot.grain) {
        case grain.minute: // base: exact at YYYY-MM-DD HH-MM
            return date
        // case 'Hour': // base: the next hour at HH:00
        //     date.setMinutes(now.getMinutes())
        //     return date
        case grain.day: // base: the next day at 00:00
            date.setHours(now.getHours())
            date.setMinutes(now.getMinutes())
            return date
        case grain.week: // base: the first day of next weeek at 00:00
            date.setDate(date.getDate() + now.getDay() - 1)
            date.setHours(now.getHours())
            date.setMinutes(now.getMinutes())
            return date
        case grain.month: // base: the first day of month at 00:00
            date.setDate(now.getDate())
            date.setHours(now.getHours())
            date.setMinutes(now.getMinutes())
            return date
        case grain.year: // base: the first day of year at 00:00
            date.setMonth(now.getMonth())
            date.setDate(now.getDate())
            date.setHours(now.getHours())
            date.setMinutes(now.getMinutes())
            return date
        default: // base: exact at YYYY-MM-DD HH-MM-SS
            return date
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
        weekly: `* * ${ datetime.getDay() }`,
        daily: '* * *'
    }

    let schedule = `${ datetime.getSeconds() } ${ datetime.getMinutes() } ${ datetime.getHours() } `

    if (recurrence) {
        for (let [key, value] of Object.entries(mapper)) {
            if (recurrence.toLowerCase().includes(key)) {
                schedule += value
            }
        }
    } else {
        schedule += `${ datetime.getDate() } ${ datetime.getMonth() + 1 } ${ datetime.getDay() }`
    }

    logger.debug(schedule)

    if (!cron.validate(schedule)) {
        throw 'invalidCronScheduleExpression'
    }

    return schedule
}
