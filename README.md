# snips-action-alarm

Snips action code for the Alarm app

## Setup

```sh
# Install the dependencies, builds the action and creates the config.ini file.
sh setup.sh
```

Don't forget to edit the `config.ini` file.

An assistant containing the intents listed below must be installed on your system. Deploy it following [these instructions](https://docs.snips.ai/articles/console/actions/deploy-your-assistant).

## Run

- Dev mode:

```sh
# Dev mode watches for file changes and restarts the action.
npm run dev
```

- Prod mode:

```sh
# 1) Lint, transpile and test.
npm start
# 2) Run the action.
npm run launch
```

## Test & Demo cases

This app only supports french 🇫🇷 and english 🇬🇧.

### `SetAlarm`

#### Set an alarm, optionally indicating a name and a recurrence

Set an alarm for the given time
> *Hey Snips, set an alarm in 5 minutes*

Set a named alarm for the given time
> *Hey Snips, can you set an alarm named yoga class at 6pm?*

Set a named alarm for the given time and recurrence
> *Hey Snips, please set an alarm called wake up every saturday at 7am*

### `GetAlarm`

#### Get the list of alarms, optionally indicating a time, name or recurrence

Get all the alarms
> *Hey Snips, what are my active alarms?*

Get the alarms with the given name
> *Hey Snips, do I have active alarms named yoga class?*

Get the alarms at the given time
> *Hey Snips, do I have alarms set for this week-end?*

### `CancelAlarm`

#### Cancel an alarm, optionally indicating a time, name or recurrence

Cancel all alarms
> *Hey Snips, please cancel all my alarms*

Cancel the alarms with the given name
> *Hey Snips, please remove all the alarms called get up*

Cancel the alarms at the given time and recurrence
> *Hey Snips, could you cancel the alarm set on sundays at 1pm?*

## Debug

In the `src/index.ts` file:

```js
// Uncomment this line to print everything
// debug.enable(name + ':*')
```

## Test

*Requires [mosquitto](https://mosquitto.org/download/) to be installed.*

```sh
npm run test
```

**In test mode, i18n output and http calls are mocked.**

- **http**: mocks are written in `tests/mocks`
- **i18n**: mocked by `snips-toolkit`, see the [documentation](https://github.com/snipsco/snips-javascript-toolkit#i18n).

## Contributing

Please see the [Contribution Guidelines](https://github.com/snipsco/snips-action-alarm/blob/master/CONTRIBUTING.md).

## Copyright

This library is provided by [Snips](https://snips.ai) as Open Source software. See [LICENSE](https://github.com/snipsco/snips-action-alarm/blob/master/LICENSE) for more information.
