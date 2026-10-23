// Función "portal" de Supabase (Edge Function).
// 1) action "radicar": verifica el captcha de Cloudflare Turnstile y radica la solicitud.
// 2) action "firmar": entrega un enlace temporal (2 minutos) para abrir un adjunto del ciudadano.
// Secretos necesarios: TURNSTILE_SECRET (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya vienen incluidos).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'METODO' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'JSON' }, 400); }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '?';
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (body.action === 'radicar') {
    const form = new FormData();
    form.append('secret', Deno.env.get('TURNSTILE_SECRET') || '');
    form.append('response', String(body.token || ''));
    if (ip !== '?') form.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const v = await r.json().catch(() => ({}));
    if (!v.success) return json({ error: 'CAPTCHA' }, 400);

    const { data, error } = await admin.rpc('radicar_solicitud', { p_datos: body.datos || {}, p_ip: ip });
    if (error) return json({ error: String(error.message || 'ERROR').slice(0, 60) }, 400);
    return json({ id: data });
  }

  if (body.action === 'firmar') {
    const { data: ruta, error } = await admin.rpc('ruta_adjunto_ciudadano', {
      p_id: body.id, p_doc4: body.doc4 || '', p_url: body.url || '', p_ip: ip,
    });
    if (error) return json({ error: String(error.message || 'ERROR').slice(0, 60) }, 429);
    if (!ruta) return json({ error: 'NO_ENCONTRADO' }, 404);
    const { data, error: e2 } = await admin.storage.from('adjuntos').createSignedUrl(ruta, 120);
    if (e2 || !data) return json({ error: 'SIN_ARCHIVO' }, 404);
    return json({ url: data.signedUrl });
  }

  return json({ error: 'ACCION' }, 400);
});
