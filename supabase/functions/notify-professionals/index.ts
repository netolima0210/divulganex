import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://supabase.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // Only allow POST from Supabase internal triggers (service role)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()
    const record = payload.record // new service_request row

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find professionals in the same state with matching category
    const { data: professionals } = await supabase
      .from('profiles')
      .select('id, push_token, name')
      .eq('role', 'professional')
      .eq('state', record.state)
      .eq('verified', true)
      .not('push_token', 'is', null)

    if (!professionals || professionals.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Filter by category match
    const { data: catMatches } = await supabase
      .from('professional_categories')
      .select('professional_id')
      .eq('category_id', record.category_id)
      .in('professional_id', professionals.map((p: any) => p.id))

    const matchedIds = new Set(catMatches?.map((c: any) => c.professional_id) ?? [])
    const targets = professionals.filter((p: any) => matchedIds.has(p.id))

    if (targets.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // Get category name
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', record.category_id)
      .single()

    // Send Expo push notifications
    const messages = targets.map((p: any) => ({
      to: p.push_token,
      title: `Novo pedido: ${category?.name ?? 'Serviço'}`,
      body: record.title,
      data: { requestId: record.id, type: 'new_request' },
      sound: 'default',
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })

    const result = await response.json()

    // Save notifications to DB
    await supabase.from('notifications').insert(
      targets.map((p: any) => ({
        user_id: p.id,
        type: 'new_request',
        title: `Novo pedido: ${category?.name ?? 'Serviço'}`,
        body: record.title,
        payload: { requestId: record.id },
        read: false,
      }))
    )

    return new Response(JSON.stringify({ sent: targets.length, result }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
