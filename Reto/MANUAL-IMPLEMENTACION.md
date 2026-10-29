# Manual de contenido — OVA Reto central

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
  · resources[0].slides[2].cards[1].icon: la imagen no existe: assets/unidad4.png
```

> `js/content.js` es un archivo generado: no se edita a mano. Si alguien lo edita, el OVA
> avisa en la consola y el generador guarda esa versión en `js/content.js.manual.bak`
> antes de reemplazarla.

### Archivos del proyecto

| Archivo | Qué es | ¿Se edita? |
|---------|--------|------------|
| `content.json` | Todo el contenido | **Sí** |
| `generar-content.command` | Valida y genera `js/content.js` | Se ejecuta |
| `assets/` | Imágenes | Agregue aquí las nuevas |
| `js/content.js` | Generado desde `content.json` | No |
| `index.html` | Estructura de la página | No |
| `css/styles.css` | Estilos base de la plantilla | No |
| `css/ajustes.css` | Ajustes de este OVA (móvil, slides, colores) | Solo para cambios de diseño |
| `js/app.js` | Arranque: portada, menú, dock, progreso | No |
| `js/carousel.js` | Botones del menú y círculo | No |
| `js/modal.js` | Modal de cada recurso | No |
| `js/slides-engine.js` | Tipos de slide | No |
| `js/data.js` | Publica el contenido y aplica `features` | No |
| `js/bg-texture.js`, `js/cursor.js` | Textura de fondo y cursor | No |

---

## Estructura de `content.json`

```jsonc
{
  "courseTitle": "Uso de inteligencia artificial generativa en los procesos en salud…",
  "unitCode": "Reto central",
  "heroImage": "assets/1_retos.webp",
  "heroImageAlt": "Dos profesionales revisando información…",
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
| `unitCode` | Etiqueta "RETO CENTRAL" (portada, encabezado y barra superior del modal) |
| `heroImage` | Imagen central del menú (dentro del círculo) |
| `heroImageAlt` | Descripción de esa imagen para lectores de pantalla |

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
| `popupLogoLeft`, `popupLogoLeftAlt` | Logo inferior izquierdo de Créditos y Bibliografía |
| `popupLogoRight`, `popupLogoRightAlt` | Logo inferior derecho de Créditos y Bibliografía |
| `footerNotice` | Texto de la franja verde del menú |

---

## `resources` — los botones del menú

Cada recurso es un botón del menú que abre un modal. Hoy hay dos: **Reto** y **Pretest**.

```jsonc
{
  "id": "01",
  "number": "01",
  "code": "La IA ya llegó a Altavista: ¿prohibirla o aprender a usarla bien?",
  "label": "Reto",
  "typeLabel": "Reto",
  "shortTitle": "Reto",
  "twoLineTitle": "Reto",
  "icon": "assets/icons/reto_1.png",
  "modalImage": "assets/reto.jpg",
  "modalImageAlt": "Médico conversando con una paciente…",
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
| `label` | Etiqueta verde sobre el título del modal |
| `code` | Título grande del modal. Si tiene más de 24 caracteres se muestra completo como titular; si es corto, la primera palabra va sólida y el resto en contorno |
| `typeLabel` | Subtítulo azul del modal y texto de la barra superior |
| `hideModalSubtitle` | `true` oculta el subtítulo azul bajo el título; `false` (o quitar la línea) lo muestra |
| `modalImage`, `modalImageAlt` | Foto de la columna izquierda del modal y su descripción |
| `slides` | Contenido del modal. **Obligatorio** (ver abajo) |

**Agregar un recurso:** copie uno completo, cambie `id` y `number` (`"03"`) y su
contenido. Con 2 recursos el menú usa el círculo con un botón arriba y otro abajo; con 3 o
más, el menú gira como una rueda (flechas del teclado, rueda del mouse o deslizar).

---

## `slides` — el contenido de cada modal

Las slides se muestran una debajo de otra y cada una tiene su pestaña en "Secciones".

Campos comunes a todas:

| Campo | Para qué |
|-------|----------|
| `type` | Tipo de slide (tabla de abajo). **Obligatorio** |
| `id` | Identificador único de la slide (`"reto-slide-1"`) |
| `tabNum`, `tabTitle` | Número y título de la pestaña (si no hay `title`) |
| `title` | Título de la slide (también es el de la pestaña) |
| `icon` | Ícono al lado del título |
| `paragraph` | Párrafo bajo el título. `null` para no mostrar ninguno |
| `hideHeader` | `true` oculta título y párrafo |

### Tipos de slide

| `type` | Para qué sirve | Campos propios |
|--------|----------------|----------------|
| `text` | Texto, listas, acordeón, destacado y botón de enlace | `subtitle`, `paragraphs`, `blocks`, `actionUrl`, `actionText`, `variant`, `heroIcon`, `kicker` |
| `flipcard` | Tarjetas que se giran | `cards`, `instruction`, `iconAboveTitle` |
| `accordion` | Preguntas desplegables | `items` |
| `featured` | Contenido destacado con cita | `category`, `text`, `highlightQuote` |
| `question` | Preguntas con retroalimentación | `questions` |
| `matching` | Unir columna A con columna B | `pairs` |
| `carousel` | Carrusel de tarjetas | `items` |
| `video` | Video de YouTube | `youtubeUrl`, `description`, `duration` |
| `bento` | Retícula de cajas | `boxes` |

#### `text`

```jsonc
{
  "type": "text", "title": "Objetivo del reto", "icon": "assets/icons/reto.png",
  "paragraph": null,
  "paragraphs": ["Primer párrafo.", "Segundo párrafo."]
}
```

**Bloques en orden** (`blocks`), para mezclar párrafos, lista, acordeón y destacado:

```jsonc
"blocks": [
  { "type": "paragraph", "text": "<em>Caso ficticio…</em>" },
  { "type": "list", "ordered": true, "items": ["Incidente 1…", "Incidente 2…"] },
  { "type": "accordion", "firstOpen": false, "items": [
      { "title": "Roles", "content": "El participante integra…" }
  ] },
  { "type": "highlight", "lead": "Pregunta del reto:", "text": "¿Cómo puede…?" }
]
```

**Botón que abre otra página** (en ventana nueva): `"actionUrl": "https://…"` y
`"actionText": "Comenzar evaluación"`.

**Tarjeta de llamado a la acción** (como el Pretest): `"variant": "cta-hero"` con
`"heroIcon"`. El primer elemento de `paragraphs` se muestra como titular y el resto como
texto de apoyo. `"kicker"` agrega una etiqueta pequeña sobre el titular.

```jsonc
{
  "type": "text", "hideHeader": true, "variant": "cta-hero",
  "heroIcon": "assets/icons/Pretest.png",
  "paragraphs": ["¡Es momento de evaluar sus conocimientos!", "Dé clic en el botón…"],
  "actionUrl": "https://genially.com", "actionText": "Comenzar evaluación"
}
```

#### `flipcard`

```jsonc
{
  "type": "flipcard", "title": "Competencias a trabajar",
  "instruction": "Haga clic en cada tarjeta para conocer la competencia de la unidad.",
  "iconAboveTitle": true,
  "cards": [
    { "num": "01", "icon": "assets/unidad1.png", "frontTitle": "Unidad 1",
      "backBadge": "COMPETENCIA", "backTitle": "Unidad 1", "backDesc": "Conocer los…" }
  ]
}
```

`frontDesc` agrega un texto bajo el título del frente. `iconAboveTitle: true` centra el
ícono grande sobre el título; sin él, el ícono va pequeño arriba a la derecha.

#### `accordion`

```jsonc
{ "type": "accordion", "title": "…", "items": [ { "title": "¿Pregunta?", "content": "Respuesta." } ] }
```

#### `featured`

```jsonc
{ "type": "featured", "title": "…", "category": "PRINCIPIO CLAVE",
  "text": "Texto del destacado.", "highlightQuote": "Cita opcional." }
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

#### `video`

```jsonc
{ "type": "video", "title": "…", "youtubeUrl": "https://www.youtube.com/watch?v=XXXX",
  "description": "…", "duration": "04:32" }
```

#### `bento`

```jsonc
"boxes": [ { "title": "…", "desc": "…", "tag": "Etiqueta", "tagColor": "green", "span": "col-2" } ]
```

`tagColor`: `blue`, `cyan`, `green` o `purple`. `span`: `col-1` o `col-2` (ancho doble).

---

## `credits` y `bibliography` — ventanas del dock

```jsonc
"credits": {
  "title": "Créditos", "iconSrc": "assets/Creditos.png",
  "supportImageSrc": "assets/credits-team-support.jpg", "supportImageAlt": "…",
  "institution": {                                   // bloque superior (opcional)
    "entities": [ "Ministerio del Trabajo…", "Servicio Nacional de Aprendizaje (SENA)" ],
    "details": [ { "role": "Ciudad:", "names": "Cali (Valle del Cauca)" } ]
  },
  "heading": "Grupo de trabajo",
  "coordination": "Coordinación general: Fundación Visión Salud",
  "subordination": "",                                // etiqueta verde; vacía = no se muestra
  "sections": [ { "role": "Asesoría y diseño pedagógico:", "names": "Nombre 1 - Nombre 2" } ],
  "legalNotice": "Las acciones de formación…"
},
"bibliography": {
  "title": "Bibliografía", "iconSrc": "assets/bibliografia.png",
  "supportImageSrc": "assets/library-support.jpg", "supportImageAlt": "…",
  "heading": "Bibliografía",
  "description": "Fuentes documentales…",
  "linkText": "Consultar recurso fuente",
  "entries": [ { "text": "Autor. (2024). <em>Título</em>.", "url": "https://…" } ]
}
```

En `credits.institution`, `entities` son las líneas en mayúsculas (entidades) y `details` los
datos con etiqueta verde (directora, edición, ciudad). Si se quita `institution`, el bloque
no aparece. Cada elemento de `sections` es un cargo (`role`) con sus nombres (`names`).

En `entries`, use `"url": null` cuando la referencia no tiene enlace.

---

## `features` — prender y apagar botones

Ponga `"enabled": false` para ocultar un botón.

| Clave | Botón |
|-------|-------|
| `creditsPopup` | Créditos del dock |
| `bibliographyPopup` | Bibliografía del dock. `"showLinks": false` oculta los enlaces de las referencias |
| `portadaScroll` | Flecha de la portada |
| `enterCarousel` | Botón "Comenzar" de la portada |
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
