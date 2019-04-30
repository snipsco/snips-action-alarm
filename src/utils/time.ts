import dayjs from 'dayjs'
import { NluSlot, slotType } from 'hermes-javascript'

export type DurationSlot = NluSlot<slotType.duration>

export const time = {
    getDurationSlotValueInMs: (slot: DurationSlot): number => {
        if (!slot)
            return 0

        const duration = slot.value
        const baseTime = dayjs().valueOf()
        const millisecondsDuration = Math.max(0,
            dayjs(baseTime)
                .add(duration.years, 'year')
                .add(duration.quarters * 3 + duration.months, 'month')
                .add(duration.weeks * 7, 'day')
                .add(duration.days, 'day')
                .add(duration.hours, 'hour')
                .add(duration.minutes, 'minute')
                .add(duration.seconds, 'second')
                .valueOf() - baseTime
        )

        // if more than 1 hour, throw an error
        if (3600000 < millisecondsDuration) {
            throw new Error('durationTooLong')
        }

        return millisecondsDuration
    }
}
