# pi-snippets

Composable prompt snippets for the Pi editor.

`pi-snippets` lets you build prompts from small reusable fragments instead of relying on one fixed template. Type an alias, press `<Tab>`, insert a fragment, then keep composing with project-specific instructions, personal habits, and task-focused guidance directly in the editor.

## Why

Prompts are more useful when they are modular. A single template is fixed, but snippets can be mixed and matched:

```text
;tdd<Tab>
;review<Tab>
;readme<Tab>
```

Use snippets as small thinking blocks. Compose them in the order the task needs.

## Composable snippet examples

Snippets work best when they are small enough to combine:

```json
{
  "version": 1,
  "snippets": [
    {
      "key": "tdd",
      "content": "Start with a failing deterministic test."
    },
    {
      "key": "step",
      "content": "Make the smallest change that produces useful feedback."
    },
    {
      "key": "edge",
      "content": "Cover happy path, unhappy path, and edge cases."
    },
    {
      "key": "why",
      "content": "Explain trade-offs and why this design is simpler."
    },
    {
      "key": "safe",
      "content": "Avoid broad refactors; keep behavior unchanged unless asked."
    }
  ]
}
```

Each snippet should express one reusable instruction. That makes them easy to mix and match across different tasks:

```text
;tdd<Tab> ;step<Tab> ;edge<Tab>
```

```text
;review<Tab> ;why<Tab> ;safe<Tab>
```

```text
;readme<Tab> ;why<Tab> ;edge<Tab>
```

```text
;refactor<Tab> ;step<Tab> ;safe<Tab>
```

## Usage

Type `;alias<Tab>` in the Pi editor:

- exact alias inserts snippet immediately
- partial alias opens filtered picker
- empty `;<Tab>` opens all snippets

Built-ins:

- `refactor` — refactor while keeping behavior unchanged
- `tests` — write deterministic tests first
- `review` — review readability, coupling/cohesion, and edge-case safety
- `readme` — update README with problem, solution, usage, and examples

## History snippets

Type `'query<Tab>` to pick from inline code snippets found in recent assistant messages.

Example: if Pi recently mentioned `npm run check`, typing `'check<Tab>` can offer that command again.

## Template examples

The template engine supports a small Pi-native subset for future interactive snippets:

| Template                                                  | Inserted text                                            | Meaning                                          |
| --------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| `fn(${1:arg}) { return $1; }$0`                           | `fn(arg) { return arg; }`                                | edit tabstop `1`, mirror updates, finish at `$0` |
| `Review ${1:file} for ${2:risk}.$0`                       | `Review file for risk.`                                  | two ordered tabstops                             |
| `Write tests for ${1:behavior}. Include $1 edge cases.$0` | `Write tests for behavior. Include behavior edge cases.` | repeated `$1` mirrors first value                |

Supported markers:

- `${1:default}` — editable placeholder with default text
- `$1` — mirror after placeholder `1`
- `$0` — final cursor position

Full UltiSnips compatibility, Python blocks, choices, and transforms are intentionally out of scope for v1.

## Custom snippets

Project-local snippets override global snippets:

1. `.pi/snippets.json`
2. `~/.pi/agent/snippets.json`

```json
{
  "version": 1,
  "snippets": [
    {
      "key": "tdd",
      "content": "Write a failing deterministic test first, then implement the minimum code."
    }
  ]
}
```

Custom snippets override built-ins by key.

## Config

Config lookup:

1. `.pi/pi-snippets.json`
2. `~/.pi/agent/pi-snippets.json`

```json
{
  "snippetTrigger": ";"
}
```

## Install

Pi package entrypoint is declared in `package.json`:

```json
{
  "pi": {
    "extensions": ["./src/index.ts"]
  }
}
```

Place this directory under `~/.pi/agent/extensions/pi-snippets/` or use Pi package loading.

## Development

```bash
npm install
npm run check
npm run all
```
