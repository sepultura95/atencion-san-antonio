# Auditoría de seguridad — Portal y panel de Programas Sociales (2026-10-24)

Alcance revisado: `index.html`, `panel.html`, `dashboard.html`, `guia.html`, `supabase_function/portal.ts`, todos los `sql_*.sql`, `vercel.json` y el historial de git.
No se pudo revisar: el estado real de Supabase (políticas ya creadas antes de estos archivos, ajustes de Auth) ni las cabeceras del sitio en producción (el entorno de trabajo no tiene acceso a Internet abierto). Ver "Lo que necesito de ti".

## Resumen: qué arreglar primero
1. **Ejecutar `sql_endurecimiento.sql`** (cierra A1, A2, M1, M2, B1).
2. **Redesplegar `portal.ts`** (cierra A1 en la función, M5).
3. **Subir `vercel.json`, `index.html`, `panel.html`, `dashboard.html`** (cabeceras M3, escapes M4, contraseña B3).
4. **Ejecutar `sql_cerrar_puertas.sql`** cuando verifiques radicar + adjuntos (cierra C1: hoy se puede insertar sin captcha y los adjuntos con cédulas son públicos).
5. En Supabase > Authentication: desactivar registros nuevos, subir largo mínimo de contraseña, activar MFA para coordinación (M6).
6. Responder las preguntas de abajo para revisar lo que no vi.

## Hallazgos

| # | Sev. | Dónde | Qué es | Qué podría hacer un atacante | Estado |
|---|---|---|---|---|---|
| C1 | Crítica (pendiente de tu acción) | `sql_cerrar_puertas.sql` sin ejecutar | Mientras no se ejecute: (a) cualquiera con la clave pública puede insertar solicitudes directo, sin captcha ni límite; (b) el bucket `adjuntos` es público: cédulas y documentos se abren con solo conocer el enlace | Llenar la base de basura; leer documentos personales si obtiene un enlace | **Pendiente: ejecutar Parte B tras probar** |
| A1 | Alta | `sql_seguridad_y_respuestas.sql:71`, `sql_recuperar_radicado.sql:24`, `portal.ts:33` | El límite de intentos usa la IP de `x-forwarded-for`, que el visitante puede escribir a su gusto | Cambiar la IP en cada intento y adivinar los 4 últimos dígitos (10 000 combinaciones) de un radicado (los radicados son consecutivos y fáciles de adivinar) → leer nombre, documento y mensajes de otra persona | **Corregido** en `sql_endurecimiento.sql` (IP de Cloudflare + bloqueo por radicado/documento: 5 fallos por 30 min) y `portal.ts`. Probado con IPs falsas: el intento 6 se bloquea |
| A2 | Alta | `sql_seguridad_y_respuestas.sql:402` | `borrar_datos_prueba()` quedó ejecutable por cualquier funcionario con sesión; el botón solo está oculto en pantalla. No vi el cuerpo de la función | Un funcionario (o quien tenga una cuenta) llama la función por API y borra solicitudes | **Corregido**: la función original pasa a `borrar_datos_prueba_interna` (sin permisos) y `borrar_datos_prueba()` ahora exige ser coordinador. Probado |
| A3 | Alta (por confirmar) | Supabase > Authentication | Si "Allow new users to sign up" está activo, cualquiera puede crear una cuenta; varias reglas dicen `to authenticated` | Registrarse y leer/borrar lo que esas reglas permiten | **Necesito confirmar el ajuste.** Mientras, M2 reduce el daño |
| M1 | Media | `sql_captcha_consentimiento.sql:150` | Los enlaces temporales de adjuntos aceptaban sin los 4 últimos dígitos del documento | Abrir adjuntos de una solicitud conociendo solo su id | **Corregido** (ahora exige los 4 dígitos) |
| M2 | Media | `sql_consultas_autoservicio.sql:32`, `sql_documentos_actividades.sql:33-55` | Reglas `to authenticated using (true)`: cualquier cuenta con sesión (no solo funcionarios) lee conteos y puede ver/borrar documentos de actividades | Leer y borrar actas y oficios | **Corregido**: solo funcionarios; borrar solo coordinación o el dueño del archivo |
| M3 | Media | `vercel.json` | No había cabeceras de seguridad (CSP, anti-iframe, nosniff, HSTS, referrer) | Clickjacking (meter el panel en un iframe y engañar un clic); un script inyectado podría enviar datos a cualquier sitio | **Corregido** en `vercel.json`. Probado: sin violaciones en portal ni panel. Limitación: la CSP necesita `unsafe-inline` porque las páginas tienen scripts y estilos dentro del HTML |
| M4 | Media | `dashboard.html:773, 799, 852, 872, 916, 945, 848/868` | El dashboard pintaba nombres, tipos y etiquetas sin escapar; el drill-down armaba `onclick` con texto | Un funcionario con cuenta mala podría guardar un texto con código y ejecutarlo en la sesión del coordinador | **Corregido**: función `esc()` y enlaces con `data-ambito` |
| M5 | Media | `portal.ts:46,54` | Devolvía mensajes internos de la base de datos al navegador (hasta 60 letras) | Conocer nombres de tablas o restricciones | **Corregido**: solo códigos conocidos. También límite de 40 KB por petición |
| M6 | Media | Panel | Sin segundo factor para coordinación; contraseña mínima de 6 en pantalla | Adivinar o robar una contraseña daría acceso a todos los datos | Subí el mínimo en pantalla a 10. **Falta** que lo configures en Supabase (ver abajo) |
| M7 | Media | `index.html:818`, `panel.html:718-719`, `dashboard.html:257` | `supabase-js@2` flotante y sin huella SRI; `xlsx-js-style@1.2.0` sin SRI | Si una versión nueva o el CDN se compromete, el código malicioso corre en el panel con la sesión del funcionario | **No aplicado**: no pude descargar el archivo del CDN para verificar la huella y un error dejaría el sitio sin cargar. Opción: fijar `@supabase/supabase-js@2.118.0` (sha384 del paquete npm: `TcHRA3zBbn+Lexh5n+Oil4guNPOS3rjNDpGRAN46u/s/mB2IZ50ceC6TYDU2yvgK`) y probar en el navegador |
| B1 | Baja | `sql_captcha_consentimiento.sql:87` | El ciudadano elige el `id` de su solicitud | Poco: no puede pisar una ajena (la clave primaria lo impide) | Sin cambio; mejor que lo genere el servidor cuando se pueda |
| B2 | Baja | `sql_seguridad_y_respuestas.sql:172-223` | `agregar_mensaje_ciudadano` y `marcar_prioritaria` solo piden el id (UUID imposible de adivinar) y no tienen límite | Spam si el id se filtra | Se limitó el historial a 300 mensajes y se validan los enlaces de archivo (trigger) |
| B3 | Baja | `index.html:1115,1625,1680`, `panel.html:745,1775` | URLs de logo, imágenes y video puestas en el HTML sin escapar | Solo explotable si alguien con permiso de coordinación (o sin él, si la tabla `configuracion_sitio` está mal protegida) guarda un valor malicioso | **Corregido**: solo enlaces `https://` y escapados |
| B4 | Baja | Adjuntos (`sql_endurecimiento.sql`) | Rutas con `..` o caracteres raros en el enlace de un archivo | Intentar firmar una ruta de otro bucket | **Corregido** con un trigger que valida todo historial, lo mande quien lo mande |
| B5 | Baja | `consultas_autoservicio` | Inserción pública sin límite de ritmo | Llenar la tabla y falsear estadísticas de "fechas de pago" | Sin cambio (poco dato en riesgo) |
| B6 | Baja | `actividades-docs` | Bucket público | Cualquiera con el enlace abre actas y oficios | Sin cambio: la pantalla lo abre por enlace público; hacerlo privado requiere cambiar el panel. Se recomienda como siguiente paso |
| B7 | Baja | `portal.ts` | CORS `*` | Ninguno práctico (función pública protegida por captcha) | Sin cambio |

## Lo que salió bien
- No hay llaves secretas en el repositorio ni en su historial (solo la clave pública de Supabase y la clave de sitio de Turnstile, que son públicas por diseño).
- El chat del ciudadano pinta todo con `textContent`; el panel escapa nombre, documento, contacto, mensajes y nombre de archivo.
- Los enlaces de adjuntos del panel solo se abren si pertenecen al almacenamiento de la Alcaldía.
- El secreto de Turnstile y la llave de servicio viven solo en la Edge Function.
- La sesión del panel y del dashboard se guarda en `sessionStorage` (se borra al cerrar el navegador).
- Radicar, consultas, enlaces temporales y limpieza de datos pasan por funciones del servidor con límites.

## Lo que necesito de ti (no lo puedo ver en el código)
1. **Políticas reales de Supabase.** Ejecuta esto en SQL Editor y pégame el resultado:
   ```sql
   select schemaname, tablename, policyname, cmd, roles, qual, with_check
     from pg_policies where schemaname in ('public','storage') order by 1,2,3;
   ```
   Necesito sobre todo las de `solicitudes` (SELECT/UPDATE/DELETE), `perfiles_funcionario`, `configuracion_sitio`, `actividades_administrativas`, `encuestas_satisfaccion` y `banners`, que se crearon antes de estos archivos.
2. **Cuerpos de estas funciones** (SQL Editor > `select pg_get_functiondef('public.nombre'::regproc);`): `consultar_estado_solicitud`, `obtener_turno`, `obtener_radicado_legible`, `existe_encuesta`, `solicitud_esta_resuelta`, `borrar_datos_prueba_interna` (ya renombrada tras ejecutar el SQL; antes `borrar_datos_prueba`).
3. **Authentication > Providers/Settings:** ¿"Allow new users to sign up" está activado? ¿"Confirm email"? ¿Largo mínimo de contraseña? ¿Hay MFA? Recomendado: registros desactivados, mínimo 10 caracteres, protección contra contraseñas filtradas y MFA para coordinación.
4. **Cabeceras reales.** En tu computador: `curl -I https://alcaldiasanantonio.com.co/` (después de subir `vercel.json`) y pégame el resultado.
5. **¿Alguna otra página incrusta tu portal con un iframe** (por ejemplo el sitio oficial de la alcaldía)? La cabecera nueva lo bloquea; si es así, la ajusto.
6. **¿Tienes Dependabot o un análisis de dependencias activado en GitHub?** No hay `package.json`, así que no pude correr un escáner de dependencias.
