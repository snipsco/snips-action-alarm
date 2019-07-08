import { Test } from 'snips-toolkit'
import {
    createDateSlot,
    createNameSlot,
    createRecurrenceSlot,
    sleep
} from './utils'

const { Session, Tools } = Test
const { getMessageKey } = Tools

beforeAll(() => {
    // Wait one second for the action bootstrap
    return sleep(1000)
})

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
            intentName: 'snips-assistant:GetAlarm',
            input: 'What is the status of my alarms?'
        })

        const endMsg = await session.end()
        expect(endMsg.text && endMsg.text.includes('getAlarms.head.found')).toBeTruthy()
    })

    it('should set a new alarm on wednesday 6 pm with missing date', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:SetAlarm',
            input: 'Schedule an alarm'
        })

        const elicitationMsg = await session.continue({
            intentName: 'snips-assistant:ElicitAlarmTime',
            input: 'on wednesday at 6 pm',
            slots: [
                createDateSlot('2019-05-29 18:00:00 +00:00')
            ]
        })
        expect(getMessageKey(elicitationMsg)).toBe('setAlarm.ask.time')

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('setAlarm.info.scheduled')
    })

    it('should cancel the alarm named wake up', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:CancelAlarm',
            input: 'Can you cancel the alarm named wake up?',
            slots: [
                createNameSlot('wake up')
            ]
        })

        const confirmationMsg = await session.continue({
            intentName: 'snips-assistant:Yes',
            input: 'Yes'
        })
        expect(confirmationMsg.intentFilter && confirmationMsg.intentFilter.includes('snips-assistant:Yes')).toBeTruthy()

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('cancelAlarm.successfullyDeletedSingle')
    })

    it('should set a new named alarm every wednesday at 8 pm', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:SetAlarm',
            input: 'Schedule an alarm named yoga class every wednesday at 8 pm',
            slots: [
                createDateSlot('2019-05-28 20:00:00 +00:00'),
                createNameSlot('wake up'),
                createRecurrenceSlot('wednesdays')
            ]
        })

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('setAlarm.info.scheduled')
    })

    it('should cancel all the alarms', async () => {
        const session = new Session()
        await session.start({
            intentName: 'snips-assistant:CancelAlarm',
            input: 'Can you cancel all the alarms?'
        })

        const confirmationMsg = await session.continue({
            intentName: 'snips-assistant:Yes',
            input: 'Yes'
        })
        expect(confirmationMsg.intentFilter && confirmationMsg.intentFilter.includes('snips-assistant:Yes')).toBeTruthy()

        const endMsg = await session.end()
        expect(getMessageKey(endMsg)).toBe('cancelAlarm.successfullyDeletedAll')
    })
})
