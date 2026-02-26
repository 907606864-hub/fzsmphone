export interface ParseAIJsonArrayOptions {
  wrapperKeys?: string[]
  allowSingleObject?: boolean
}

const DEFAULT_WRAPPER_KEYS = [
  'data',
  'items',
  'list',
  'entries',
  'characters',
  'results',
]

function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i)
  return match ? match[1].trim() : trimmed
}

function normalizeCandidate(text: string): string {
  let value = stripCodeFence(text).replace(/^\uFEFF/, '').trim()
  value = value.replace(/^json\s*\r?\n/i, '').trim()
  value = value.replace(/^json\s*[:\uFF1A]\s*/i, '').trim()
  return value
}

function parseBalancedJsonSegment(text: string, start: number): string | null {
  const first = text[start]
  if (first !== '[' && first !== '{') return null

  const stack: string[] = [first === '[' ? ']' : '}']
  let inString = false
  let escaped = false

  for (let i = start + 1; i < text.length; i += 1) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '[') {
      stack.push(']')
      continue
    }
    if (ch === '{') {
      stack.push('}')
      continue
    }
    if (ch === ']' || ch === '}') {
      const expected = stack.pop()
      if (expected !== ch) return null
      if (stack.length === 0) {
        return text.slice(start, i + 1).trim()
      }
    }
  }

  return null
}

function collectCandidates(raw: string): string[] {
  const set = new Set<string>()
  const push = (value: string) => {
    const normalized = normalizeCandidate(value)
    if (normalized) set.add(normalized)
  }

  const trimmed = raw.trim()
  if (!trimmed) return []

  push(trimmed)
  push(stripCodeFence(trimmed))

  const fencedRegex = /```(?:json|javascript|js)?\s*([\s\S]*?)```/gi
  let match: RegExpExecArray | null = null
  while ((match = fencedRegex.exec(raw)) !== null) {
    push(match[1])
  }

  const scanSources = [trimmed, stripCodeFence(trimmed)]
  for (const source of scanSources) {
    for (let i = 0; i < source.length; i += 1) {
      if (source[i] !== '[' && source[i] !== '{') continue
      const segment = parseBalancedJsonSegment(source, i)
      if (segment) {
        push(segment)
        i += Math.max(segment.length - 1, 0)
      }
    }
  }

  return Array.from(set)
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function toArray(
  parsed: unknown,
  wrapperKeys: string[],
  allowSingleObject: boolean
): any[] | null {
  if (Array.isArray(parsed)) return parsed
  if (!parsed || typeof parsed !== 'object') return null

  const obj = parsed as Record<string, unknown>
  for (const key of wrapperKeys) {
    const value = obj[key]
    if (Array.isArray(value)) return value
  }

  if (allowSingleObject) return [obj]
  return null
}

export function parseAIJsonArray(
  content: string,
  options: ParseAIJsonArrayOptions = {}
): any[] {
  const wrapperKeys = options.wrapperKeys || DEFAULT_WRAPPER_KEYS
  const allowSingleObject = options.allowSingleObject ?? true
  const candidates = collectCandidates(content)

  for (const candidate of candidates) {
    const parsed = tryParseJson(candidate)
    if (parsed === undefined) continue
    const result = toArray(parsed, wrapperKeys, allowSingleObject)
    if (result) return result
  }

  throw new Error('AI 返回的格式无法解析，请重试')
}
