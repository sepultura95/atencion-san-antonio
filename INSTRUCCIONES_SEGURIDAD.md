# Seguridad: captcha, consentimiento y adjuntos privados — orden de pasos

1. Supabase > SQL Editor: ejecutar `sql_captcha_consentimiento.sql` (parte A, una vez).
2. Cloudflare Turnstile (gratis): crear un widget para el dominio del portal. Copiar "Site key" y "Secret key".
3. Supabase > Edge Functions > crear función `portal`, pegar `supabase_function/portal.ts`,
   DESACTIVAR "Verify JWT", y en Secrets agregar `TURNSTILE_SECRET` = la Secret key.
4. En `index.html`: `const TURNSTILE_SITEKEY = '...'` con la Site key. Subir `index.html`, `panel.html`, `version.json`.
5. Probar: radicar una solicitud (aparece consentimiento y captcha), consultarla y abrir un adjunto.
6. Solo si todo funciona: ejecutar `sql_cerrar_puertas.sql` (parte B). Cierra el envío directo y vuelve privados los adjuntos.
