import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Restrict CORS to known origins (see create-checkout for rationale).
const ALLOWED_ORIGINS = new Set<string>([
  'https://onalert.app',
  'http://localhost:5173',
])

function corsOrigin(req: Request): string {
  const o = req.headers.get('origin') || ''
  return ALLOWED_ORIGINS.has(o) ? o : 'https://onalert.app'
}

function buildCors(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(req),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // GET: return total booking click count (public)
  if (req.method === 'GET') {
    const { count } = await supabase
      .from('booking_clicks')
      .select('*', { count: 'exact', head: true })

    return new Response(JSON.stringify({ count: count || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // POST: track a booking click (authenticated)
  if (req.method === 'POST') {
    try {
      const authHeader = req.headers.get('Authorization')!
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)

      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { alert_id, location_id } = await req.json()

      await supabase.from('booking_clicks').insert({
        alert_id,
        user_id: user.id,
        location_id,
      })

      const { count } = await supabase
        .from('booking_clicks')
        .select('*', { count: 'exact', head: true })

      return new Response(JSON.stringify({ success: true, total_count: count || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Track booking click error:', error)
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
})
