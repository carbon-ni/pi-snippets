# Architecture

This repository uses one standard JavaScript project shape.

## Folders

- `src/domain/`: business/domain rules. No infrastructure imports.
- `src/lib/`: shared pure helpers. No app-specific side effects.
- `src/bin/`: executable entrypoints and CLI glue.
- `src/infra/`: adapters for filesystem, network, process, databases, or external tools.
- `src/fixtures/`: deterministic test fixture data.

## Dependency direction

Allowed direction:

```text
src/bin -> src/domain -> src/lib
src/bin -> src/infra
src/infra -> src/domain or src/lib
```

Forbidden direction:

```text
src/domain -> src/infra
src/lib -> src/domain, src/infra, or src/bin
```

## Configuration

Use one configuration model per executable.

Precedence:

```text
defaults < config file < environment variables < explicit CLI flags
```

Do not read environment variables inside domain code. Read config at the edge in `src/bin/` or `src/infra/`, then pass explicit values inward.
