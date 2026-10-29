# OVA SENA · Reto central

Objeto virtual de aprendizaje en HTML, CSS y JavaScript, sin dependencias ni
servidor. Se abre con doble clic en `index.html`.

> **¿Va a cambiar textos, imágenes o slides?** Todo el contenido está en
> `content.json`. El paso a paso, con ejemplos de cada tipo de slide, está en
> **[MANUAL-IMPLEMENTACION.md](MANUAL-IMPLEMENTACION.md)**.

## Cómo se cambia el contenido

1. Editar `content.json` (admite comentarios `//`).
2. Ejecutar `generar-content.command` con doble clic (o `node tools/generar-content.js`).
   El generador revisa el archivo, avisa si falta un campo o una imagen y crea
   `js/content.js`, que es el que lee la página.
3. Recargar `index.html` en el navegador.

`js/content.js` se genera solo y queda en modo de solo lectura: no se edita a mano.

## Qué controla `content.json`

| Bloque | Qué define |
| :--- | :--- |
| `courseTitle`, `unitCode`, `heroImage` | Título del curso, unidad e imagen del centro del menú |
| `branding` | Título de la pestaña, fondo de la portada, logos (color y blanco), logos de los popups y aviso legal |
| `resources` | Botones del menú circular (uno por recurso) y el modal de cada uno: etiqueta, título, imagen y slides |
| `credits` | Popup de créditos |
| `bibliography` | Popup de bibliografía |
| `features` | Interruptores (por ejemplo, mostrar u ocultar los enlaces de la bibliografía) |

Tipos de slide disponibles: `text`, `featured`, `question`, `matching`,
`flipcard`, `carousel`, `video`, `bento` y `accordion`. Una slide de texto
también puede llevar `blocks` (párrafos, lista, acordeón y destacado), un botón
de enlace (`actionUrl` / `actionText`) o el diseño de llamado a la acción
(`"variant": "cta-hero"`).

## Estructura de archivos

```
index.html                 Página (no lleva contenido escrito)
content.json               Contenido editable
generar-content.command    Genera js/content.js a partir de content.json
MANUAL-IMPLEMENTACION.md   Guía para editar el contenido
assets/                    Imágenes, íconos y logos
css/styles.css             Estilos base de la plantilla
css/ajustes.css            Componentes propios de este OVA y vista móvil
js/content.js              Contenido generado (no editar)
js/data.js                 Publica el contenido para el resto de scripts
js/app.js                  Portada, menú, logos, popups y progreso
js/carousel.js             Menú circular (en móvil, círculo con pines)
js/modal.js                Modal de cada recurso
js/slides-engine.js        Dibuja las slides y las pestañas de secciones
js/bg-texture.js           Textura animada del fondo
js/cursor.js               Cursor personalizado en escritorio
tools/generar-content.js   Script del generador
```

## Compatibilidad

- Escritorio y móvil (desde 360 px de ancho), en vertical y horizontal.
- Navegación con teclado: Tab, Enter y Escape para cerrar el modal.
- Respeta la preferencia del sistema de reducir el movimiento.
