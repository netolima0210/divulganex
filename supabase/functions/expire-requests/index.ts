import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status: 'closed' })
    .eq('status', 'open')
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('Error expiring requests:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`Expired ${data?.length ?? 0} requests`)
  return new Response(
    JSON.stringify({ expired: data?.length ?? 0, ids: data?.map((r) => r.id) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
