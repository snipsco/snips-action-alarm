import { handler, ConfidenceThresholds } from 'snips-toolkit'
import { setAlarmHandler } from './setAlarm'
import { getAlarmHandler } from './getAlarm'
import { cancelAlarmHandler } from './cancelAlarm'
import { INTENT_PROBABILITY_THRESHOLD, ASR_UTTERANCE_CONFIDENCE_THRESHOLD } from '../constants'

const thresholds: ConfidenceThresholds = {
    intent: INTENT_PROBABILITY_THRESHOLD,
    asr: ASR_UTTERANCE_CONFIDENCE_THRESHOLD
}

// Add handlers here, and wrap them.
export default {
    setAlarm: handler.wrap(setAlarmHandler, thresholds),
    getAlarm: handler.wrap(getAlarmHandler, thresholds),
    cancelAlarm: handler.wrap(cancelAlarmHandler, thresholds)
}
