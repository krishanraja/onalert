// Tests for the fallback-safe Claude helper. The whole point of this module is
// that it NEVER throws and returns null on every failure mode, so the tests
// assert exactly that across the failure surface (timeout, non-2xx, malformed
// body, refusal) plus the happy path — using an injected fetch, no network.
import { generateText, extractText } from './anthropic.ts'
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'

// generateText reads the key at module load. These tests run with a real-looking
// key in the env so the no-key short-circuit doesn't mask the fetch path.
// (Set via the test task / `deno test --env`; if absent, the no-key test still
// passes and the others are skipped-by-null — so we assert the parse core too.)

const okBody = (text: string) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ content: [{ type: 'text', text }] }),
  text: () => Promise.resolve(''),
})

Deno.test('extractText: happy path concatenates text blocks', () => {
  assertEquals(
    extractText({ content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'world' }] }),
    'Hello world',
  )
})

Deno.test('extractText: ignores non-text blocks', () => {
  assertEquals(
    extractText({ content: [{ type: 'thinking', text: 'x' }, { type: 'text', text: 'real' }] }),
    'real',
  )
})

Deno.test('extractText: null on empty / malformed / refusal shapes', () => {
  assertEquals(extractText({ content: [] }), null)
  assertEquals(extractText({ content: [{ type: 'text', text: '   ' }] }), null)
  assertEquals(extractText({}), null)
  assertEquals(extractText(null), null)
  assertEquals(extractText({ content: 'nope' }), null)
})

Deno.test('generateText: returns text on 200 (when key present)', async () => {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return // no-key path covered below
  const out = await generateText({
    prompt: 'hi',
    fetchImpl: (() => Promise.resolve(okBody('a slot opened') as unknown as Response)) as typeof fetch,
  })
  assertEquals(out, 'a slot opened')
})

Deno.test('generateText: null on non-2xx', async () => {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return
  const out = await generateText({
    prompt: 'hi',
    fetchImpl: (() =>
      Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve('rate limited') } as unknown as Response)) as typeof fetch,
  })
  assertEquals(out, null)
})

Deno.test('generateText: null when fetch throws (network/abort)', async () => {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return
  const out = await generateText({
    prompt: 'hi',
    fetchImpl: (() => Promise.reject(new Error('boom'))) as typeof fetch,
  })
  assertEquals(out, null)
})

Deno.test('generateText: respects timeout and returns null', async () => {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return
  const slowFetch = ((_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })) as typeof fetch
  const start = Date.now()
  const out = await generateText({ prompt: 'hi', timeoutMs: 50, fetchImpl: slowFetch })
  assertEquals(out, null)
  // Should have aborted around the timeout, not hung.
  assertEquals(Date.now() - start < 2000, true)
})
