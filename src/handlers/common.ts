import { IntentMessage, slotType, NluSlot, grain } from 'hermes-javascript'
import { message, logger, getCompletedDatetime } from '../utils'
import {
    SLOT_CONFIDENCE_THRESHOLD,
    INTENT_PROBABILITY_THRESHOLD,
    ASR_UTTERANCE_CONFIDENCE_THRESHOLD
} from '../constants'

export type KnownSlots = {
    depth: number
    name?: string
    date?: Date
    recurrence?: string
}

export default async function (msg: IntentMessage, knownSlots: KnownSlots) {
    if (msg.intent) {
        if (msg.intent.confidenceScore < INTENT_PROBABILITY_THRESHOLD) {
            throw new Error('intentNotRecognized')
        }
        if (message.getAsrConfidence(msg) < ASR_UTTERANCE_CONFIDENCE_THRESHOLD) {
            throw new Error('intentNotRecognized')
        }
    }

    let name: string | undefined, recurrence: string | undefined, date: Date | undefined

    if (!('name' in knownSlots)) {
        const nameSlot: NluSlot<slotType.custom> | null = message.getSlotsByName(msg, 'alarm_name', {
            onlyMostConfident: true,
            threshold: SLOT_CONFIDENCE_THRESHOLD
        })

        if (nameSlot) {
            name = nameSlot.value.value
        }
    } else {
        name = knownSlots.name
    }

    if (!('recurrence' in knownSlots)) {
        const recurrenceSlot: NluSlot<slotType.custom> | null = message.getSlotsByName(msg, 'recurrence', {
            onlyMostConfident: true,
            threshold: SLOT_CONFIDENCE_THRESHOLD
        })

        if (recurrenceSlot) {
            recurrence = recurrenceSlot.value.value
        }
    } else {
        recurrence = knownSlots.recurrence
    }

    if (!('date' in knownSlots)) {
        const dateSlot: NluSlot<slotType.instantTime | slotType.timeInterval> | null = message.getSlotsByName(msg, 'datetime', {
            onlyMostConfident: true,
            threshold: SLOT_CONFIDENCE_THRESHOLD
        })

        if (dateSlot) {
            if (dateSlot.value.kind === 'TimeInterval') {
                date = getCompletedDatetime({
                    kind: slotType.instantTime,
                    value: dateSlot.value.from,
                    grain: grain.minute,
                    precision: 'Exact'
                })
            } else if (dateSlot.value.kind === 'InstantTime') {
                date = getCompletedDatetime(dateSlot.value)
            }
        }
    } else {
        date = knownSlots.date
    }

    logger.info('\tname: ', name)
    logger.info('\trecurrence: ', recurrence)
    logger.info('\tdate: ', date)

    return { name, recurrence, date }
}
