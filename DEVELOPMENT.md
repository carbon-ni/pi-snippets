# Development Guardrails

Run `make hooks` once after cloning.

## Lifecycle

### Session Start

- Intent: start from current repository truth.
- Operator command(s): `git status --short && make check`
- Enforcement: local command before changing code.
- Failure signal: dirty unknown state or failing checks.
- Recovery: inspect failures, fix, then rerun `make check`.

### Formatting

- Intent: keep code mechanically consistent.
- Operator command(s): `make format` or `make format-fix`
- Enforcement: pre-commit and CI via `make check`.
- Failure signal: Prettier exits non-zero.
- Recovery: run `make format-fix`.

### Linting

- Intent: catch simple bugs before review.
- Operator command(s): `make lint`
- Enforcement: pre-commit and CI via `make check`.
- Failure signal: ESLint exits non-zero.
- Recovery: fix reported lines, then rerun `make lint`.

### Tests

- Intent: prove behavior with deterministic tests.
- Operator command(s): `make test`
- Enforcement: pre-commit and CI via `make check`.
- Failure signal: Node test runner exits non-zero.
- Recovery: fix code or test expectation, then rerun `make test`.

### Coverage

- Intent: show test reach and regression risk.
- Operator command(s): `make coverage`
- Enforcement: pre-push and CI via `make all`.
- Failure signal: Node coverage command exits non-zero.
- Recovery: add missing behavior tests or remove dead code.

### Done

- Intent: make completion objective.
- Operator command(s): `make all && git status --short`
- Enforcement: pre-push and CI.
- Failure signal: failing gate or untracked intended files.
- Recovery: fix failures, stage intended files, rerun `make all`.

## Anti-patterns

- CI-only checks with no local equivalent. Add a `Makefile` target first.
- Domain code importing infrastructure. Move side effects to `src/infra/` or `src/bin/`.
- Multiple config formats for one executable. Use one config path and documented precedence.
- Flaky tests depending on network, wall clock, or user machine state. Inject or fixture inputs.
