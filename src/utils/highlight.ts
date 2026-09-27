export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const tokenPattern = /`[^`\n]+`|<\/?[A-Za-z][\w-]*>|\{\{[\w.-]+\}\}|\+\+\+[A-Za-zА-Яа-яЁё0-9_-]+|"[^"\n]+"\s*:\s*"[^"\n]*"|[→∈∩∪¬⊕]|\b[A-ZА-ЯЁ]{3,}\b/g

function tokenClass(token: string): string {
  if (token.startsWith('`')) return 'code'
  if (token.startsWith('<')) return 'xml'
  if (token.startsWith('{{')) return 'variable'
  if (token.startsWith('+++')) return 'decorator'
  if (token.startsWith('"')) return 'json'
  if (/^[→∈∩∪¬⊕]$/.test(token)) return 'symbol'
  return 'caps'
}

function highlightLine(line: string): string {
  if (/^##\s+.+/.test(line)) {
    return `<span class="token heading">${escapeHtml(line)}</span>`
  }
  if (/^\s*—\s*$/.test(line)) {
    return `<span class="token separator">${escapeHtml(line)}</span>`
  }

  let result = ''
  let lastIndex = 0
  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0
    result += escapeHtml(line.slice(lastIndex, index))
    result += `<span class="token ${tokenClass(match[0])}">${escapeHtml(match[0])}</span>`
    lastIndex = index + match[0].length
  }
  return result + escapeHtml(line.slice(lastIndex))
}

export function highlightPrompt(text: string): string {
  return text.split('\n').map(highlightLine).join('\n')
}
