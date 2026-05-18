# pi-snippets

Minimal Pi extension for editor snippets.

## Usage

Type `;alias<Tab>` in Pi editor:

- exact alias inserts immediately
- partial alias opens picker
- empty `;<Tab>` opens all snippets

Built-ins:

- `refactor`
- `tests`
- `review`
- `readme`

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
