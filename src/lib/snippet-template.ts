export interface TextRange {
  index: number;
  start: number;
  end: number;
}

export interface ExpandedSnippet {
  text: string;
  tabstops: TextRange[];
  mirrors: TextRange[];
  finalCursor: number;
}

interface Token {
  index: number;
  value: string;
  isPlaceholder: boolean;
}

const tokenPattern = /\$\{(\d+):([^}]*)\}|\$(\d+)/g;

function toToken(match: RegExpExecArray): Token {
  if (match[1] !== undefined) {
    return { index: Number(match[1]), value: match[2] ?? "", isPlaceholder: true };
  }

  return { index: Number(match[3]), value: "", isPlaceholder: false };
}

function tabstopOrder(left: TextRange, right: TextRange): number {
  if (left.index === 0) return 1;
  if (right.index === 0) return -1;
  return left.index - right.index;
}

export function expandSnippetTemplate(template: string): ExpandedSnippet {
  const tabstops: TextRange[] = [];
  const mirrors: TextRange[] = [];
  const seenTabstops = new Set<number>();
  let text = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(template)) !== null) {
    text += template.slice(lastIndex, match.index);

    const token = toToken(match);
    const value = token.isPlaceholder ? token.value : "";
    const mirroredTabstop =
      token.index !== 0 && !token.isPlaceholder && seenTabstops.has(token.index);
    const range = { index: token.index, start: text.length, end: text.length + value.length };

    if (mirroredTabstop) {
      const tabstop = tabstops.find((item) => item.index === token.index);
      const mirrorValue = tabstop === undefined ? "" : text.slice(tabstop.start, tabstop.end);
      mirrors.push({ ...range, end: range.start + mirrorValue.length });
      text += mirrorValue;
    } else {
      tabstops.push(range);
      seenTabstops.add(token.index);
      text += value;
    }

    lastIndex = match.index + match[0].length;
  }

  text += template.slice(lastIndex);

  tabstops.sort(tabstopOrder);
  const finalTabstop = tabstops.find((tabstop) => tabstop.index === 0);

  return {
    text,
    tabstops,
    mirrors,
    finalCursor: finalTabstop?.start ?? text.length,
  };
}

function replaceRanges(
  snippet: ExpandedSnippet,
  replacements: TextRange[],
  value: string,
): ExpandedSnippet {
  const ranges = [...snippet.tabstops, ...snippet.mirrors].sort(
    (left, right) => left.start - right.start,
  );
  const replacementKeys = new Set(replacements.map((range) => `${range.start}:${range.end}`));
  const tabstops: TextRange[] = [];
  const mirrors: TextRange[] = [];
  let text = "";
  let cursor = 0;
  let delta = 0;

  for (const range of ranges) {
    const replacing = replacementKeys.has(`${range.start}:${range.end}`);
    const nextValue = replacing ? value : snippet.text.slice(range.start, range.end);
    const start = range.start + delta;
    const end = start + nextValue.length;

    text += snippet.text.slice(cursor, range.start) + nextValue;
    cursor = range.end;
    delta += nextValue.length - (range.end - range.start);

    const nextRange = { index: range.index, start, end };
    if (
      snippet.tabstops.some((tabstop) => tabstop.start === range.start && tabstop.end === range.end)
    ) {
      tabstops.push(nextRange);
    } else {
      mirrors.push(nextRange);
    }
  }

  text += snippet.text.slice(cursor);
  tabstops.sort(tabstopOrder);
  const finalTabstop = tabstops.find((tabstop) => tabstop.index === 0);

  return {
    text,
    tabstops,
    mirrors,
    finalCursor: finalTabstop?.start ?? text.length,
  };
}

export function applyTabstopEdit(
  snippet: ExpandedSnippet,
  tabstopIndex: number,
  value: string,
): ExpandedSnippet {
  const tabstop = snippet.tabstops.find((item) => item.index === tabstopIndex);
  if (tabstop === undefined) return snippet;

  const mirrors = snippet.mirrors.filter((mirror) => mirror.index === tabstopIndex);
  return replaceRanges(snippet, [tabstop, ...mirrors], value);
}
