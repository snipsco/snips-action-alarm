import { IntentMessage, slotType, NluSlot } from 'hermes-javascript'
import { message, logger } from '../utils'
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

    logger.info('\tname: ', name)
    logger.info('\trecurrence: ', recurrence)

    return { name, recurrence }
}
