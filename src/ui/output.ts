/**
 * Render `cmd item [item ...]` as a copy-pasteable shell command. A single item
 * stays on one line; multiple items are backslash-continued and aligned under
 * the first argument.
 */
export function formatMultiline(cmd: string, items: readonly string[]): string {
  if (items.length === 1) return `  ${cmd} ${items[0]}`;
  const indent = ' '.repeat(cmd.length + 3);
  return items
    .map((item, i) => {
      const prefix = i === 0 ? `  ${cmd} ` : indent;
      const suffix = i === items.length - 1 ? '' : ' \\';
      return `${prefix}${item}${suffix}`;
    })
    .join('\n');
}
