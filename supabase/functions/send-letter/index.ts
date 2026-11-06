import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'Sign in to save a letter' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment configuration')
    return json({ error: 'Letter storage is not configured' }, 500)
  }

  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authorization } } },
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Sign in to save a letter' }, 401)

    let input: Record<string, unknown>
    try {
      const parsed: unknown = await req.json()
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return json({ error: 'Request must be a JSON object' }, 400)
      }
      input = parsed as Record<string, unknown>
    } catch {
      return json({ error: 'Request must contain valid JSON' }, 400)
    }

    const { kind, body, recipient_email } = input
    if (typeof body !== 'string' || !body.trim() || body.length > 20000 ||
        (kind !== 'me' && kind !== 'friend')) {
      return json({ error: 'Enter a letter of up to 20,000 characters' }, 400)
    }
    if (recipient_email !== undefined && recipient_email !== null &&
        (typeof recipient_email !== 'string' ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email))) {
      return json({ error: 'Enter a valid recipient email address' }, 400)
    }

    const { data: letter, error } = await supabase
      .from('letters')
      .insert({
        user_id: user.id,
        kind,
        body,
        recipient_email: kind === 'friend' ? recipient_email ?? null : null,
      })
      .select()
      .single()
    if (error) throw error

    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey || !user.email) {
      if (!apiKey) console.error('RESEND_API_KEY is not configured; letter was saved without email')
      return json({ saved: true, emailed: false, id: letter.id })
    }

    const to = [user.email]
    if (kind === 'friend' && typeof recipient_email === 'string') to.push(recipient_email)

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('FROM_EMAIL') ?? 'Archive of Unspoken Memories <onboarding@resend.dev>',
          to,
          subject: 'A letter from the Archive of Unspoken Memories',
          html: `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;white-space:pre-wrap;line-height:1.6">${esc(body)}</div>`,
        }),
      })
      if (!res.ok) {
        console.error('Resend rejected the email:', res.status)
        return json({ saved: true, emailed: false, id: letter.id })
      }

      const { error: updateError } = await supabase
        .from('letters')
        .update({ emailed_at: new Date().toISOString() })
        .eq('id', letter.id)
      if (updateError) console.error('Could not record email delivery:', updateError.message)
      return json({ saved: true, emailed: true, id: letter.id })
    } catch (emailError) {
      console.error('Email delivery failed:', emailError)
      return json({ saved: true, emailed: false, id: letter.id })
    }
  } catch (e) {
    console.error('Could not save letter:', e)
    return json({ error: 'Could not save your letter. Please try again.' }, 500)
  }
})
