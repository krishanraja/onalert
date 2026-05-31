// Minimal, fallback-safe Claude text helper for the OnAlert edge functions.
//
// Design contract for the AI layer: AI is an ENHANCEMENT, never a dependency.
// Every call here returns `string | null` and never throws — callers MUST have a
// deterministic fallback and use the AI text only when it's non-null. This keeps
// AI strictly off the critical alert path: a timeout, a missing key, a rate
// limit, or a malformed response degrades to the heuristic with zero user impact.
//
// Uses the current Messages API (POST /v1/messages, anthropic-version
// 2023-06-01). Defaults to Haiku 4.5 (`claude-haiku-4-5`) — fast + cheap, the
// right tier for short narration/summary. Haiku does NOT support `effort` or
// adaptive `thinking` (they 400), so this helper intentionally omits them.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export const HAIKU = 'claude-haiku-4-5'

export interface GenerateTextOptions {
  prompt: string
  system?: string
  /** Default 256 — these are short generations. */
  maxTokens?: number
  /** Default HAIKU. Pass a Sonnet id for tool-call / reasoning tasks. */
  model?: string
  /** Hard timeout in ms (default 2500). On timeout, returns null. */
  timeoutMs?: number
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch
  /** Cache the system block (only effective for prefixes >~4096 tokens). */
  cacheSystem?: boolean
}

/**
 * Generate a short text completion. Returns the text, or null on ANY failure
 * (no key, timeout, non-2xx, malformed body, empty content). Never throws.
 */
export async function generateText(opts: GenerateTextOptions): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null

  const {
    prompt,
    system,
    maxTokens = 256,
    model = HAIKU,
    timeoutMs = 2500,
    fetchImpl = fetch,
    cacheSystem = false,
  } = opts

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }
    if (system) {
      body.system = cacheSystem
        ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
        : system
    }

    const res = await fetchImpl(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.error(`anthropic ${res.status}: ${await res.text().catch(() => '')}`)
      return null
    }

    const data = await res.json()
    return extractText(data)
  } catch (err) {
    // AbortError (timeout) and network errors both land here — degrade silently.
    if ((err as Error)?.name !== 'AbortError') {
      console.error('anthropic error:', (err as Error).message)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Pull the concatenated text out of a Messages API response. Exported for unit
 * testing the parse contract independently of the network. Returns null for any
 * shape that doesn't contain non-empty text (refusal, empty content, etc.).
 */
export function extractText(data: unknown): string | null {
  const content = (data as { content?: unknown })?.content
  if (!Array.isArray(content)) return null
  const text = content
    .filter((b): b is { type: string; text: string } =>
      !!b && typeof b === 'object' && (b as { type?: string }).type === 'text' &&
      typeof (b as { text?: unknown }).text === 'string',
    )
    .map((b) => b.text)
    .join('')
    .trim()
  return text.length > 0 ? text : null
}
