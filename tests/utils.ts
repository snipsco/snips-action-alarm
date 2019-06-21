import { Enums, NluSlot } from 'hermes-javascript/types'

type CustomSlot = NluSlot<typeof Enums.slotType.custom>
type DateSlot = NluSlot<typeof Enums.slotType.instantTime>

export function sleep(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration))
}

export function createDateSlot(datetime: string): DateSlot {
    return {
        slotName: 'datetime',
        entity: 'snips/datetime',
        confidenceScore: 1,
        rawValue: datetime,
        value: {
            kind: Enums.slotType.instantTime,
            value: datetime,
            grain: Enums.grain.hour,
            precision: 'Exact'
        },
        range: {
            start: 0,
            end: 1
        }
    }
}

export function createNameSlot(name: string): CustomSlot {
    return {
        slotName: 'alarm_name',
        entity: 'alarm_custom',
        confidenceScore: 1,
        rawValue: name,
        value: {
            kind: Enums.slotType.custom,
            value: name
        },
        range: {
            start: 0,
            end: 1
        }
    }
}

export function createRecurrenceSlot(recurrence: string): CustomSlot {
    return {
        slotName: 'recurrence',
        entity: 'recurrence_custom',
        confidenceScore: 1,
        rawValue: recurrence,
        value: {
            kind: Enums.slotType.custom,
            value: recurrence
        },
        range: {
            start: 0,
            end: 1
        }
    }
}