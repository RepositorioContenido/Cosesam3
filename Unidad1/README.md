# OVA SENA · Unidad 1

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
| `courseTitle`, `unitCode` | Título del curso y etiqueta de la unidad |
| `branding` | Título de la pestaña, fondo de la portada, logos (color y blanco), logos de los popups y aviso legal |
| `resources` | Botones del menú circular (uno por recurso), la imagen central de cada uno y su modal: etiqueta, título, imagen y slides (o un video de YouTube) |
| `credits` | Popup de créditos |
| `bibliography` | Popup de bibliografía |
| `features` | Interruptores (por ejemplo, mostrar u ocultar los enlaces de la bibliografía) |

Tipos de slide disponibles: `text`, `featured`, `bento`, `podcast`, `video`,
`flipcard`, `accordion`, `question`, `matching` y `carousel`. Una slide de texto
también puede llevar imagen, pregunta destacada, un botón de enlace
(`actionUrl` / `actionText`) o el diseño de llamado a la acción
(`"variant": "cta-hero"`). El podcast reproduce el archivo de `audioSrc`.

## Estructura de archivos

```
index.html                 Página (no lleva contenido escrito)
content.json               Contenido editable
generar-content.command    Genera js/content.js a partir de content.json
MANUAL-IMPLEMENTACION.md   Guía para editar el contenido
assets/                    Imágenes, íconos, logos y audios
css/styles.css             Estilos
js/content.js              Contenido generado (no editar)
js/data.js                 Publica el contenido para el resto de scripts
js/app.js                  Portada, menú, logos, popups y progreso
js/carousel.js             Menú circular
js/modal.js                Modal de cada recurso (slides o video)
js/slides-engine.js        Dibuja las slides y las pestañas de secciones
js/bg-texture.js           Textura animada del fondo
js/cursor.js               Cursor personalizado en escritorio
tools/generar-content.js   Script del generador
```

## Compatibilidad

- Escritorio y móvil (desde 360 px de ancho), en vertical y horizontal.
- Navegación con teclado: Tab, Enter y Escape para cerrar el modal.
- Respeta la preferencia del sistema de reducir el movimiento.
