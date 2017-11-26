# API

## Library and JSON-RPC Client

The library `@dicy/core` and the JSON-RPC client `@dicy/client` share a common
API with the exception of initialization methods. Both packages export various
types defined in [Common Types][] and a class `DiCy` that implements an
interface which creates and caches builders. That interface is defined below and
extends [EventEmitter][].

```typescript
interface BuilderCacheInterface extends EventEmitter {
  destroy(): Promise<void>;

  get(file: Uri): Promise<BuilderInterface>;

  clear(file: Uri): Promise<void>;
  clearAll(): Promise<void>;

  getTargetPaths(file: Uri): Promise<string[]>;

  kill(file: Uri, message?: string): Promise<void>;
  killAll(message?: string): Promise<void>;

  run(file: Uri, commands: Command[]): Promise<boolean>;

  setInstanceOptions(file: Uri, options: object, merge?: boolean): Promise<void>;
  setUserOptions(file: Uri, options: object, merge?: boolean): Promise<void>;
  setDirectoryOptions(file: Uri, options: object, merge?: boolean): Promise<void>;
  setProjectOptions(file: Uri, options: object, merge?: boolean): Promise<void>;
}
```

`BuilderCacheInterface` provides two methods of building documents using DiCy.
The first is to let `DiCy` find and call the appropriate method on the specific
builder. For instance, to build `foo.tex` with SyncTeX enabled one would do the
following.

```javascript
const dicy = new DiCy()

await dicy.setInstanceOptions('file:///bar/foo.tex', { synctex: true })
await dicy.run('file:///bar/foo.tex', ['load', 'build', 'save'])
```

In order to capture log messages produced during the build or during the `log`
command one needs to listen to the `log` event where `messages` is an array
of `Message`.

```javascript
dicy.on('log', (file, messages) => {
  for (const message of messages) {
    const nameText = event.name ? `[${event.name}] ` : ''
    const typeText = event.category ? `${event.category}: ` : ''
    const text = `${event.severity} ${nameText}${typeText}${event.text.replace('\n', ' ')}`

    console.log(text)
  }
})

await dicy.run('file:///bar/foo.tex', ['load', 'build', 'log', 'save'])
```

To retrieve targets produced by a build `getTargetPaths` can be called.
Please note that `synctex.gz` files are also returned in addition to PDF,
DVI or PostScript files.

A build can be interupted by calling `kill` or all builds can be stopped by
calling `killAll`. The `DiCy` class caches builders based on main file path.
This cache can be cleared on file specific basis with `clear` or the complete
cache can be cleared with `clearAll`. Once building is done the instance should
be released with `destroy`.

A specific builder can also be retrieved with the `get` method. The returned
builder will implement the following interface.

```typescript
interface BuilderInterface extends EventEmitter {
  getTargetPaths(): Promise<string[]>;

  kill(message?: string): Promise<void>;

  run(commands: Command[]): Promise<boolean>;

  setInstanceOptions(options: object, merge?: boolean): Promise<void>;
  setUserOptions(options: object, merge?: boolean): Promise<void>;
  setDirectoryOptions(options: object, merge?: boolean): Promise<void>;
  setProjectOptions(options: object, merge?: boolean): Promise<void>;
}
```

This instance can be used in the same way as described above except that the
root file path does not need to be passed to each method. For example, to build
and log one would do the following.

```javascript
const builder = dicy.get('file:///bar/foo.tex')

builder.on('log', (messages) => {
  for (const message of messages) {
    const nameText = event.name ? `[${event.name}] ` : ''
    const typeText = event.category ? `${event.category}: ` : ''
    const text = `${event.severity} ${nameText}${typeText}${event.text.replace('\n', ' ')}`

    console.log(text)
  }
})

await builder.setInstanceOptions({ synctex: true })
await builder.run(['load', 'build', 'log', 'save'])
```

The received log events will only be from the specific builder. This means that
multiple builds can be in progress at the same time an will not interfere with
each other.

### Common Types

Both `@dicy/core` and `@dicy/client` export various types used by DiCy builders.
The most common are listed below and are primarily used in the
`BuilderCacheInterface` and `BuilderInterface` for commands and log messages.

```typescript
type Command = 'build' | 'clean' | 'graph' | 'load' | 'log' | 'save' | 'scrub';

interface LineRange {
  start: number;
  end: number;
}

interface Reference {
  file: string;
  range?: LineRange;
}

type Severity = 'trace' | 'info' | 'warning' | 'error';

export interface Message {
  severity: Severity;
  text: string;
  name?: string;
  category?: string;
  source?: Reference;
  log?: Reference;
}
```

## JSON-RPC Server

`@dicy/server` implements a JSON-RPC interface to DiCy that can be accessed
using `@dicy/client` or directly via a JSON-RPC client. The interface provided
by `@dicy/server` mirrors `BuilderCacheInterface` without the `get` method. The
server may be started using the shell command `dicy-server` with an option that
specifies the transport mechanism.

-   `--node-ipc` — Use Node-IPC
-   `--pipe` — Use a named pipe. For example: `--pipe=foo`
-   `--socket` — Use a socket. For example: `--socket=5000`
-   `--stdio` — User standard input/ouput

### RPC Requests and Notificatons

| Name                         | Type                | Parameters                                        | Return             |
|------------------------------|---------------------|---------------------------------------------------|--------------------|
| `clear`                      | Server Request      | `file: Uri`                                       | `Promise<void>`    |
| `clearAll`                   | Server Request      | None                                              | `Promise<void>`    |
| `exit`                       | Server Notification | None                                              | None               |
| `kill`                       | Server Request      | `file: Uri`, `message?: string`                   | `Promise<void>`    |
| `killAll`                    | Server Request      | `message?: string`                                | `Promise<void>`    |
| `log`                        | Client Notification | `file: Uri`, `messages: Message[]`                | None               |
| `run`                        | Server Request      | `file: Uri`, `commands: Command[]`                | `Promise<boolean>` |
| `setDirectoryOptionsRequest` | Server Request      | `file: Uri`, `options: object`, `merge?: boolean` | `Promise<boolean>` |
| `setInstanceOptionsRequest`  | Server Request      | `file: Uri`, `options: object`, `merge?: boolean` | `Promise<boolean>` |
| `setProjectOptionsRequest`   | Server Request      | `file: Uri`, `options: object`, `merge?: boolean` | `Promise<boolean>` |
| `setUserOptionsRequest`      | Server Request      | `file: Uri`, `options: object`, `merge?: boolean` | `Promise<boolean>` |

[common types]: #common-types

[eventemitter]: https://nodejs.org/api/events.html#events_class_eventemitter
