# Dirección de diseño — Portal de atención al usuario (Alcaldía de San Antonio, Tolima)

**Audiencia:** ciudadanos (muchos adultos mayores, muchos desde celular) que vienen a radicar, consultar un trámite o ver fechas de pago.
**Personalidad:** cercana, clara, confiable. Institucional sin parecer portal oficial de gobierno nacional (no se usan escudos ni colores oficiales no confirmados).
**Rasgo distintivo:** encabezado grande con "San Antonio" en dorado, bloque de bienvenida azul con tres acciones grandes que "cuelgan" sobre el fondo claro.

## Tokens (en `:root` de `index.html`)
- Azul marino `--green-700 #16324a` / `--green-900 #0f2538` (nombres heredados; son azules). Dorado `--ochre-500 #f2b632`. Fondo `--paper #eef5fa`.
- Texto `--ink #1c2b38`, secundario `--ink-soft #485d70` (contraste ≥ 6:1 sobre blanco).
- Tipografía: Outfit (títulos), Atkinson Hyperlegible (texto, pensada para baja visión).
- Radios: tarjetas 20–22 px, botones 12 px. Palabra destacada en títulos: cursiva en dorado (sobre azul) o `#946800` (sobre claro).

## Contenido configurable (panel → Apariencia)
Logo, fondo del encabezado, noticia/video/imágenes destacadas, banners por mes y redes sociales (`configuracion_sitio.redes`).

## Movimiento
Entrada escalonada de las tres acciones; secciones aparecen al hacer scroll (IntersectionObserver). Respeta `prefers-reduced-motion`. Sin JS todo es visible.

## Accesibilidad
Controles A-/A/A+, alto contraste y lectura en voz alta se conservan. Foco visible: dorado sobre fondos oscuros, azul marino sobre tarjetas claras.
