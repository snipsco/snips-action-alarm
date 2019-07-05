import cron from 'node-cron'
import { grain } from 'hermes-javascript/types'

export type DateGrain = {
    date: string
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
 * Convert an incomple date to an exact time,
 * filling the unclear parts by current time sub-segments
 */
export const getExactDate = (dateGrain: DateGrain): Date => {
    const now = new Date(Date.now())
    let date = new Date(dateGrain.date)

    switch (dateGrain.grain) {
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
export const getScheduleString = (date: Date, recurrence: string | null): string => {
    const mapper = {
        mondays: '* * Mon',
        tuesdays: '* * Tue',
        wednesdays: '* * Wed',
        thursdays: '* * Thu',
        fridays: '* * Fri',
        saturdays: '* * Sat',
        sundays: '* * Sun',
        weekly: `* * ${ date.getDay() }`,
        daily: '* * *'
    }

    let schedule = `${ date.getSeconds() } ${ date.getMinutes() } ${ date.getHours() } `

    if (recurrence) {
        for (let [key, value] of Object.entries(mapper)) {
            if (recurrence.toLowerCase().includes(key)) {
                schedule += value
            }
        }
    } else {
        schedule += `${ date.getDate() } ${ date.getMonth() + 1 } ${ date.getDay() }`
    }

    if (!cron.validate(schedule)) {
        throw 'invalidCronScheduleExpression'
    }

    return schedule
}
