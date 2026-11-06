// supabase/functions/send-letter/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
}
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401, headers: cors })

    const { kind, body, recipient_name, recipient_email } = await req.json()
    if (!body || !['me', 'friend'].includes(kind)) {
      return new Response('Bad request', { status: 400, headers: cors })
    }

    // 1. Save to the person's private archive (RLS applies)
    const { data: letter, error } = await supabase
      .from('letters')
      .insert({ user_id: user.id, kind, body, recipient_name, recipient_email })
      .select().single()
    if (error) throw error

    // 2. Email a copy to their own inbox (and the friend's, if given)
    const to = [user.email!]
    if (kind === 'friend' && recipient_email) to.push(recipient_email)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') ?? 'Archive of Unspoken Memories <onboarding@resend.dev>',
        to,
        subject: 'A letter from the Archive of Unspoken Memories',
        html: `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;white-space:pre-wrap;line-height:1.6">${esc(body)}</div>`,
      }),
    })
    if (res.ok) {
      await supabase.from('letters').update({ emailed_at: new Date().toISOString() }).eq('id', letter.id)
    }
    return new Response(JSON.stringify({ saved: true, emailed: res.ok, id: letter.id }),
      { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(String(e), { status: 500, headers: cors })
  }
})
