import { Test } from 'snips-toolkit'
import {
    createDateSlot,
    createNameSlot
} from './utils'

const { Session, Tools } = Test
const { getMessageKey } = Tools

describe('Alarm app', () => {
    it('should set a new alarm on monday 6 am', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:SetAlarm',
            input: 'Schedule an alarm on monday at 6 am',
            slots: [
                createDateSlot('2019-05-27 06:00:00 +00:00')
            ]
        })

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('setAlarm.info.scheduled')
    })

    it('should set a new named alarm on tuesday 6 pm', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:SetAlarm',
            input: 'Schedule an alarm named wake up on tuesday at 6 pm',
            slots: [
                createDateSlot('2019-05-28 18:00:00 +00:00'),
                createNameSlot('wake up')
            ]
        })

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('setAlarm.info.scheduled')
    })

    it('should get the 2 alarms status', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:GetAlarms',
            input: 'What is the status of my alarms?'
        })

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('getAlarms.head.found')
    })

    it('should cancel the alarm named wake up', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:CancelAlarm',
            input: 'Can you cancel the alarm named wake up?'
        })

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('getAlarms.head.found')
    })
})
