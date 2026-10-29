# Manual de implementación · OVA Recursos de apoyo

Todo el contenido se cambia en `content.json`. Después de guardar, ejecute
`generar-content.command` y recargue `index.html`. Si algo está mal, el
generador lo explica y no cambia nada.

## 1. Portada y encabezado

```json
"courseTitle": "Nombre completo del curso",
"unitCode": "Recursos de apoyo",
```

`courseTitle` aparece en el círculo de la portada y en el encabezado; `unitCode`
en la etiqueta azul. En `branding` se cambian el fondo de la portada
(`portadaImage`), los logos y el aviso legal del pie de página, igual que en el Reto.

## 2. Menú superior

### Unidades

```json
"units": [
  { "id": "u1", "label": "Unidad 1", "title": "Nombre completo de la unidad 1" },
  { "id": "u2", "label": "Unidad 2", "title": "Nombre completo de la unidad 2" }
]
```

- `label` es el texto de la pestaña.
- `title` se muestra como título grande cuando la unidad está seleccionada.
- La pestaña **Todas** se agrega sola.
- Para agregar la unidad transversal: `{ "id": "ut", "label": "Transversal", "title": "..." }`.

### Tipos de recurso

```json
"types": [
  { "id": "anexos", "label": "Anexos", "icon": "anexos" },
  { "id": "complementario", "label": "Material complementario", "icon": "complementario" },
  { "id": "glosario", "label": "Glosario", "icon": "glosario" },
  { "id": "bibliografia", "label": "Bibliografía", "icon": "bibliografia" }
]
```

- El orden de la lista es el orden de los grupos en la cuadrícula.
- El filtro **Todos** se agrega solo y cada filtro muestra cuántos recursos tiene.
- `icon` puede ser `anexos`, `complementario`, `glosario` o `bibliografia`.
- Los ids `glosario` y `bibliografia` tienen un diseño de tarjeta propio
  (término y definición; referencia completa).

### Textos de los botones

```json
"buttons": { "pdf": "Abrir PDF", "video": "Ver video", "web": "Visitar sitio", "reference": "Consultar recurso" }
```

## 3. Tarjetas (`items`)

Una tarjeta por recurso. `id` no se puede repetir; `unit` y `type` deben existir
en las listas anteriores.

**Anexo o material complementario**

```json
{
  "id": "r01",
  "unit": "u1",
  "type": "anexos",
  "title": "Guía rápida: configuración inicial segura...",
  "text": "Descripción corta del recurso.",
  "reference": "García, I. (2026). <em>Guía rápida...</em> [Recurso del curso AF1]. Asohosval – SENA.",
  "url": "https://...",
  "format": "pdf"
}
```

`format` cambia el ícono y el texto del botón: `pdf`, `video` o `web`.

**Glosario**

```json
{ "id": "r20", "unit": "u1", "type": "glosario", "title": "Término", "text": "Definición." }
```

**Bibliografía**

```json
{ "id": "r26", "unit": "u1", "type": "bibliografia", "reference": "Autor. (Año). <em>Título</em>. Editorial.", "url": "https://..." }
```

- Use `"url": null` si la referencia no tiene enlace: la tarjeta se muestra sin botón.
- En `reference`, `title` y `text` se puede usar `<em>cursiva</em>`.

## 4. Comportamiento

- Los enlaces se abren en una pestaña nueva.
- Al abrir un recurso, la tarjeta queda marcada como consultada (✓) y avanza la
  barra de progreso del encabezado. El avance y los filtros elegidos se guardan
  en el navegador.
- En celular el menú superior queda fijo arriba y las pestañas y filtros se
  desplazan en horizontal.

## 5. Créditos y bibliografía del dock

Se configuran igual que en el Reto (`credits` y `bibliography`).
