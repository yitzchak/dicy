# Events

## action

-   event: `{ type: 'action', rule: <ruleId>, action: 'run' | 'updateDependencies', triggers: <fileTriggers> }`

The `action` event is emitted when a rule is activated to run or update
dependencies. The `triggers` property lists any files the caused the activation
of the action.

## command

-   event: `{ type: 'command', rule: <ruleId>, command: <commandString> }`

The `command` event is emitted when a shell command is executed. For instance,
by the [LaTeX][] rule when executing `pdflatex`.

## fileAdded

-   event: `{ type: 'fileAdded', file: <filePath> }`

The `fileAdded` event is emitted when a file is added to the current build
state. The file may be an input or an output file, so the `inputAdded` or
`outputAdded` might also be triggered.

## fileChanged

-   event: `{ type: 'fileChanged', file: <filePath> }`

The `fileChanged` event is emitted when a file is has been modified.

## fileDeleted

-   event: `{ type: 'fileDeleted', file: <filePath> }`

The `fileDeleted` event is emitted when a file is deleted by a command such
as the [clean][] command.

## fileRemoved

-   event: `{ type: 'fileRemoved', file: <filePath> }`

The `fileRemoved` event is emitted when a file is found to no longer exist and
needs to be removed from dependent rules.

## inputAdded

-   event: `{ type: 'inputAdded', rule: <ruleId>, file: <filePath> }`

The `inputAdded` event is emitted when a file is added as an input to a rule.

## log

-   event: `{ type: 'message', message: <message> }`

The `log` event is emitted when a when a log message is received.

## outputAdded

-   event: `{ type: 'outputAdded', rule: <ruleId>, file: <filePath> }`

The `outputAdded` event is emitted when a file is added as an output to a rule.

[clean]: commands#clean

[latex]: rules#latex
