# Snippet template formats

## Decision for now

Keep JSON as the stable v1 storage format, but keep core snippet logic storage-agnostic.

## Why JSON is OK now

- Simple to parse.
- Deterministic and safe.
- Works for short snippets.
- Existing config already uses it.

## Known JSON limitations

- Multiline snippets are noisy because of escaping.
- No comments.
- Large snippet catalogs become hard to organize.
- Placeholder-heavy templates are less readable inside strings.
- Metadata growth can make schema awkward.
- Dynamic behavior should not be embedded directly in JSON.

## Architectural direction

Separate normalized snippet model from storage adapters.

```ts
type Snippet = {
  key: string;
  content: string;
  description?: string;
  scope?: string[];
};
```

Core/domain code should consume normalized snippets only.

```text
src/lib/snippets.ts              pure catalog helpers
src/lib/snippet-template.ts     pure template parser/expander
src/infra/snippet-store.ts      JSON loader now, more loaders later
```

## Future options

- Keep `.pi/snippets.json` for simple snippets.
- Add `.pi/snippets/*.snippet` for readable multiline templates.
- Consider VS Code/TextMate-compatible snippet JSON if compatibility matters.
- Consider YAML/TOML only if comments/readability outweigh adding another parser.

## Small next step

Add optional `description` and `scope` fields to the normalized `Snippet` model when there is a concrete UI/use case.
Do not change storage format until JSON pain is proven by usage.
