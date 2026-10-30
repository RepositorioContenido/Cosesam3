# Manual de contenido — OVA Unidad 2

Todo lo que se ve en el OVA (textos, imágenes, logos, slides, créditos, bibliografía y
botones) se cambia en **un solo archivo: `content.json`**. El código no se toca.

---

## Cómo aplicar un cambio

1. Edite `content.json` y guárdelo.
2. Doble clic en **`generar-content.command`**. Valida el archivo y genera `js/content.js`.
3. Abra `index.html` y recargue con **Cmd + Shift + R**.

Si el paso 2 encuentra un error (una coma de más, una imagen que no existe, un tipo de
slide mal escrito) **no cambia nada** y le indica exactamente qué y dónde:

```
content.json tiene 1 error(es):
  · resources[0].slides[1].image: la imagen no existe: assets/retomar.png
```

> `js/content.js` es un archivo generado: no se edita a mano. Si alguien lo edita, el OVA
> avisa en la consola y el generador guarda esa versión en `js/content.js.manual.bak`
> antes de reemplazarla.

### Archivos del proyecto

| Archivo | Qué es | ¿Se edita? |
|---------|--------|------------|
| `content.json` | Todo el contenido | **Sí** |
| `generar-content.command` | Valida y genera `js/content.js` | Se ejecuta |
| `assets/` | Imágenes y audios | Agregue aquí los nuevos |
| `js/content.js` | Generado desde `content.json` | No |
| `index.html` | Estructura de la página | No |
| `css/styles.css` | Estilos | Solo para cambios de diseño |
| `js/app.js` | Arranque: portada, menú, dock, progreso | No |
| `js/carousel.js` | Botones del menú circular | No |
| `js/modal.js` | Modal de cada recurso | No |
| `js/slides-engine.js` | Tipos de slide | No |
| `js/data.js` | Publica el contenido y aplica `features` | No |
| `js/bg-texture.js`, `js/cursor.js` | Textura de fondo y cursor | No |

---

## Estructura de `content.json`

```jsonc
{
  "courseTitle": "Uso de inteligencia artificial generativa en los procesos en salud…",
  "unitCode": "Unidad 2",
  "branding":     { … },   // logos, fondo de portada, pie de página
  "resources":    [ … ],   // un botón del menú por recurso
  "credits":      { … },   // ventana Créditos
  "bibliography": { … },   // ventana Bibliografía
  "features":     { … }    // prender / apagar botones
}
```

Obligatorios: `courseTitle`, `unitCode` y al menos un recurso.

| Campo | Dónde se ve |
|-------|-------------|
| `courseTitle` | Título del círculo de la portada y del encabezado del menú |
| `unitCode` | Etiqueta "UNIDAD 1" (portada, encabezado, barra superior del modal y ventanas del dock) |

---

## `branding` — logos, portada y pie de página

| Campo | Dónde se ve |
|-------|-------------|
| `pageTitle` | Título de la pestaña del navegador |
| `portadaImage` | Foto de fondo de la portada |
| `logoLeftWhite` | Logo izquierdo de la portada (versión blanca) |
| `logoLeft` | Logo izquierdo del encabezado del menú (a color) |
| `logoLeftAlt` | Descripción del logo izquierdo |
| `logoRightWhite` | Logo derecho de la portada (versión blanca) |
| `logoRight` | Logo derecho del encabezado del menú (a color) |
| `logoRightAlt` | Descripción del logo derecho |
| `popupLogoLeft`, `popupLogoLeftAlt` | Logo "+ de 25 años": pie de Créditos y Bibliografía y esquina inferior del menú |
| `popupLogoRight`, `popupLogoRightAlt` | Logo "#FormaciónContinua": pie de Créditos y Bibliografía y esquina inferior del menú |
| `footerNotice` | Texto de la franja verde del menú |

---

## `resources` — los botones del menú

Cada recurso es un botón del menú que abre un modal. Hoy hay cinco: Reflexión del reto,
Video conceptual, Actividad teórica, Actividad práctica y Podcast.

```jsonc
{
  "id": "01",
  "number": "01",
  "code": "Reflexión sobre el Reto",
  "codeHighlight": "Reto",
  "label": "Unidad 1",
  "typeLabel": "Reflexión sobre el reto",
  "shortTitle": "Reflexión del reto",
  "twoLineTitle": "Reflexión<br>del&nbsp;reto",
  "icon": "assets/icons/reto.png",
  "featuredImage": "assets/1_retos.png",
  "featuredImageAlt": "Dos profesionales revisando información…",
  "modalImage": "assets/8.png",
  "modalImageAlt": "Profesionales de salud frente a una pantalla…",
  "slides": [ … ]
}
```

| Campo | Dónde se ve |
|-------|-------------|
| `id` | Identificador interno (`"01"`, `"02"`…). **Obligatorio** |
| `number` | Número grande del botón del menú. **Obligatorio** |
| `shortTitle` | Título del botón del menú |
| `twoLineTitle` | Igual que `shortTitle`, pero permite partirlo con `<br>` |
| `icon` | Ícono del botón del menú |
| `featuredImage`, `featuredImageAlt` | Imagen central del menú cuando ese botón está seleccionado, y su descripción |
| `label` | Etiqueta verde sobre el título del modal |
| `code` | Título grande del modal (ver abajo) |
| `codeHighlight` | Palabra del título que se muestra en verde (por ejemplo `"Reto"`) |
| `isTextTitle` | `true` muestra el título en el tamaño menor de los títulos largos, aunque sea corto |
| `typeLabel` | Subtítulo bajo el título del modal y texto de la barra superior |
| `hideResourceTitle` | `true` oculta ese subtítulo (también se oculta solo si repite el título) |
| `modalImage`, `modalImageAlt` | Foto de la columna izquierda del modal y su descripción |
| `slides` | Contenido del modal (ver abajo) |
| `youtubeUrl` | Solo para recursos de video sin `slides`: el modal muestra únicamente ese video |

**Cómo se muestra el título (`code`):** con `codeHighlight`, la palabra indicada va en
verde. Si el título tiene más de 25 caracteres, lleva `?` o `isTextTitle: true`, se muestra
en un tamaño menor para que no ocupe demasiadas líneas. Si es corto, se muestra grande, como "Reflexión sobre el Reto".

**Recurso de video** (como el 02): sin `slides` y con
`"youtubeUrl": "https://www.youtube.com/watch?v=XXXX"`. El video ocupa todo el modal.
Para mostrarlo con imagen, título y pestañas, use en cambio una slide de tipo `video`.

**Agregar un recurso:** copie uno completo, cambie `id` y `number` (`"06"`) y su
contenido. El menú gira como una rueda (flechas del teclado, rueda del mouse o deslizar).

---

## `slides` — el contenido de cada modal

Las slides se muestran una debajo de otra y cada una tiene su pestaña en "Secciones".

Campos comunes a todas:

| Campo | Para qué |
|-------|----------|
| `type` | Tipo de slide (tabla de abajo). **Obligatorio** |
| `id` | Identificador único de la slide (`"slide-1"`) |
| `tabNum`, `tabTitle` | Número y título de la pestaña |
| `title` | Título de la slide |
| `icon` | Ícono al lado del título y en la pestaña |
| `subtitle` | Texto pequeño sobre el título |
| `paragraph` | Párrafo bajo el título. `null` para no mostrar ninguno |
| `hideHeader` | `true` oculta título y párrafo |

### Tipos de slide

| `type` | Para qué sirve | Campos propios |
|--------|----------------|----------------|
| `text` | Párrafos, imagen, pregunta destacada y botón de enlace | `paragraphs`, `image`, `imageAlt`, `imageCaption`, `highlightLead`, `highlightQuestion`, `actionUrl`, `actionText`, `variant` |
| `featured` | Contenido destacado | `featuredTitle`, `text`, `badge`, `category`, `highlightQuote` |
| `bento` | Retícula de cajas | `boxes`, `variant` |
| `podcast` | Reproductor de audio | `audioSrc`, `playerTitle`, `description`, `duration`, `notes` |
| `video` | Video de YouTube | `youtubeUrl`, `description`, `duration` |
| `flipcard` | Tarjetas que se giran | `cards` |
| `accordion` | Preguntas desplegables | `items` |
| `question` | Preguntas con retroalimentación | `questions` |
| `matching` | Unir columna A con columna B | `pairs` |
| `carousel` | Carrusel de tarjetas | `items` |

#### `text`

```jsonc
{
  "type": "text", "title": "1. Retomar el reto", "icon": "assets/1.retomar.png",
  "paragraph": "Párrafo bajo el título.",
  "paragraphs": ["Primer párrafo.", "Segundo párrafo."],
  "image": "assets/consulta_externa_altavista.jpg", "imageAlt": "…", "imageCaption": "…"
}
```

**Pregunta destacada:** `"highlightLead": "Pregunta orientadora:"` y
`"highlightQuestion": "¿…?"`.

**Botón que abre otra página** (en ventana nueva): `"actionUrl": "https://…"` y
`"actionText": "Ir a la actividad"`.

**Tarjeta de llamado a la acción** (como las actividades teórica y práctica):
`"variant": "cta-hero"` con `"heroIcon"`. `"headline"` es el titular, `"kicker"` una etiqueta
pequeña sobre él y `paragraphs` el texto de apoyo.

```jsonc
{
  "type": "text", "hideHeader": true, "variant": "cta-hero",
  "heroIcon": "assets/icons/Act_teorica.png",
  "kicker": "Actividad teórica", "headline": "…",
  "paragraphs": ["…"],
  "actionUrl": "https://…", "actionText": "Ir a la actividad"
}
```

#### `featured`

```jsonc
{ "type": "featured", "title": "…", "featuredTitle": "…", "badge": "UNIDAD 1",
  "category": "…", "text": "Texto del destacado.", "highlightQuote": "Cita opcional." }
```

`"showFeaturedBadge": false` oculta la fila "★ DESTACADO".

#### `bento`

```jsonc
"boxes": [ { "tag": "Etiqueta", "tagColor": "green", "title": "…", "desc": "…", "span": "col-2" } ]
```

`tagColor`: `blue`, `cyan`, `green` o `purple`. `span`: `col-1` o `col-2` (ancho doble).
`"variant": "questions"` muestra las cajas como preguntas para reflexionar.

#### `podcast`

```jsonc
{
  "type": "podcast", "title": "Propósito del podcast", "icon": "assets/icons/podcast.png",
  "playerTitle": "Unidad 2. Uso seguro, ético y responsable…", "description": "Podcast: pasos para la acción",
  "audioSrc": "assets/podcast-unidad2.mp3",
  "notes": ["00:45 • Primer punto clave.", "01:30 • Segundo punto clave."]
}
```

- `audioSrc` es el archivo de audio (MP3). Sin `audioSrc` (o con `""`), el reproductor
  aparece deshabilitado con el aviso "Audio no disponible todavía".
- La duración se toma del archivo. `duration` solo se muestra mientras el audio carga.
- `notes` es la lista de "Puntos clave del episodio". Sin `notes`, no se muestra.
- `notesTitle` cambia el título de esa lista.
- `tag` cambia la etiqueta verde ("CÁPSULA SONORA FORMATIVA"); `""` la oculta.

**Cómo enlazar el audio del podcast** (modal 05, slide de tipo `"podcast"`):

1. Copie el archivo en la carpeta `assets/` de esta unidad, con un nombre sin espacios
   ni tildes. Por ejemplo: `assets/podcast-unidad2.mp3`.
2. En `content.json`, dentro del slide `"type": "podcast"`, agregue `audioSrc` (por ejemplo
   después de `"description"`). Revise que la línea anterior termine en coma:
   ```jsonc
   "description": "Podcast: pasos para la acción",
   "audioSrc": "assets/podcast-unidad2.mp3",
   "duration": "03:15"
   ```
3. Opcional: para mostrar los puntos clave debajo del reproductor, agregue `notes`:
   ```jsonc
   "notes": ["00:45 • Primer punto clave.", "01:30 • Segundo punto clave."],
   ```
4. Ejecute `generar-content.command` y recargue `index.html`. El reproductor se activa solo.

Si el audio está publicado en internet (por ejemplo, en el LMS), `audioSrc` también acepta
un enlace directo al archivo: `"audioSrc": "https://…/podcast.mp3"`. El generador muestra
un aviso de "ruta fuera de assets/", pero funciona.

#### `video`

```jsonc
{ "type": "video", "title": "…", "youtubeUrl": "https://www.youtube.com/watch?v=XXXX",
  "description": "…", "duration": "04:32" }
```

#### `flipcard`

```jsonc
"cards": [ { "num": "01", "icon": "assets/…", "frontTitle": "…", "frontDesc": "…",
             "backTitle": "…", "backDesc": "…" } ]
```

#### `accordion`

```jsonc
"items": [ { "title": "¿Pregunta?", "content": "Respuesta." } ]
```

#### `question`

```jsonc
"questions": [
  { "type": "single", "question": "¿…?", "instructions": "Seleccione una respuesta:",
    "options": [ { "text": "Opción A", "correct": true, "feedback": "¡Correcto! …" },
                 { "text": "Opción B", "feedback": "Revise el tema 2." } ] },
  { "type": "multiple", "question": "¿…?", "options": [ … ] },
  { "type": "open", "question": "¿…?", "placeholder": "Escriba su respuesta…" }
]
```

`single` = una correcta, `multiple` = varias correctas, `open` = respuesta abierta.

#### `matching`

```jsonc
"pairs": [ { "aId": "a1", "aText": "Concepto", "bId": "b1", "bText": "Definición." } ]
```

La columna B se baraja sola.

#### `carousel`

```jsonc
"items": [ { "title": "…", "desc": "…", "category": "…", "image": "assets/…", "icon": "assets/…" } ]
```

---

## `credits` y `bibliography` — ventanas del dock

```jsonc
"credits": {
  "title": "Créditos", "iconSrc": "assets/Creditos.png",
  "supportImageSrc": "assets/3.png", "supportImageAlt": "…",
  "institutionalLines": [ "MINISTERIO DEL TRABAJO…", "SERVICIO NACIONAL DE APRENDIZAJE (SENA)" ],
  "executiveDirector": "Ligia Elvira Viáfara Torres",
  "edition": "octubre/2026",
  "city": "Cali (Valle del Cauca)",
  "groupHeader": "GRUPO DE TRABAJO",
  "sections": [ { "role": "Asesoría y diseño pedagógico:", "names": "Nombre 1 - Nombre 2" } ],
  "legalNotice": "Las acciones de formación…"
},
"bibliography": {
  "title": "Bibliografía", "iconSrc": "assets/bibliografia.png",
  "supportImageSrc": "assets/7.png", "supportImageAlt": "…",
  "heading": "Bibliografía",
  "description": "Fuentes documentales…",
  "linkText": "Consultar recurso fuente",
  "entries": [ { "text": "Autor. (2024). <em>Título</em>.", "url": "https://…" } ]
}
```

- `institutionalLines` son las entidades del bloque superior.
- `executiveDirector`, `edition` y `city` son los datos debajo de las entidades. Si se quita
  `institutionalLines`, ese bloque no aparece.
- Cada elemento de `sections` es un cargo (`role`) con sus nombres (`names`).
- `coordination` (opcional) agrega una línea bajo "GRUPO DE TRABAJO".
- En `entries`, use `"url": null` cuando la referencia no tiene enlace.

---

## `features` — prender y apagar botones

Ponga `"enabled": false` para ocultar un botón.

| Clave | Botón |
|-------|-------|
| `creditsPopup` | Créditos del dock |
| `bibliographyPopup` | Bibliografía del dock. `"showLinks": false` oculta los enlaces de las referencias |
| `carouselNav` | Flechas anterior / siguiente del menú |
| `portadaScroll` | Flecha de la portada |
| `enterCarousel` | Botón "Comenzar" de la portada |
| `circularImage` | Imagen central del menú (al hacer clic abre el recurso) |
| `modalClose` | Cerrar del modal |
| `popupClose` | Cerrar de Créditos / Bibliografía |

---

## Texto con formato

Los textos aceptan HTML básico: `<strong>negrita</strong>`, `<em>cursiva</em>` y `<br>`
para un salto de línea. Las comillas dentro de un texto se escriben `\"`.

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| `content.json tiene un error de sintaxis` | Revise comas y comillas cerca de la línea indicada |
| `la imagen no existe: assets/…` | Copie la imagen a `assets/` o corrija el nombre (mayúsculas incluidas) |
| `"tipo" no existe` | Use uno de los tipos de la tabla de slides |
| El OVA sigue mostrando lo anterior | Ejecute `generar-content.command` y recargue con Cmd + Shift + R |
| Aviso `El contenido fue editado FUERA de content.json` | Pase el cambio a `content.json` y vuelva a generar |
