# Events

## action

### Object

```javascript
{
  type: 'action',
  rule: string, // Rule ID
  action: 'parse' | 'run' | 'updateDependencies',
  triggers: Array<string> // File paths that triggered the action
}
```

### Description

The `action` event is emitted when a rule is activated to run or update
dependencies. The `triggers` property lists any files the caused the activation
of the action.

## command

### Object

```javascript
{
  type: 'command',
  rule: string, // Rule ID
  command: string // Command line
}
```

### Description

The `command` event is emitted when a shell command is executed. For instance,
when executing `pdflatex`.

## fileAdded

### Object

```javascript
{
  type: 'fileAdded',
  file: string, // Path file
}
```

### Description

The `fileAdded` event is emitted when a file is added to the current build
state. The file may be an input or an output file, so the `inputAdded` or
`outputAdded` might also be triggered.

## fileChanged

### Object

```javascript
{
  type: 'fileChanged',
  file: string, // Path file
}
```

### Description

The `fileChanged` event is emitted when a file is has been modified.

## fileDeleted

### Object

```javascript
{
  type: 'fileDeleted',
  file: string, // Path file
}
```

### Description

The `fileDeleted` event is emitted when a file is deleted by a command such
as the [clean][] command.

## fileRemoved

### Object

```javascript
{
  type: 'fileRemoved',
  file: string, // Path file
}
```

### Description

The `fileRemoved` event is emitted when a file is found to no longer exist and
needs to be removed from dependent rules.

## inputAdded

### Object

```javascript
{
  type: 'inputAdded',
  rule: string, // Rule ID
  file: string, // Path file
}
```

### Description

The `inputAdded` event is emitted when a file is added as an input to a rule.

## log

### Object

```javascript
{
  type: 'message',
  message: Message
}
```

### Description

The `log` event is emitted when a when a log message is received.

## outputAdded

### Object

```javascript
{
  type: 'outputAdded',
  rule: string, // Rule ID
  file: string, // Path file
}
```

### Description

The `outputAdded` event is emitted when a file is added as an output to a rule.

[clean]: commands#clean
