# OVA SENA · Recursos de apoyo

Objeto virtual de aprendizaje en HTML, CSS y JavaScript, sin dependencias ni
servidor. Se abre con doble clic en `index.html`.

Usa la misma portada, encabezado, dock (inicio, créditos y bibliografía) y pie
de página que la plantilla del Reto. Lo que cambia es el menú: en lugar del
carrusel hay un **menú superior** para navegar por **unidad** y por **tipo de
recurso**, y una **cuadrícula de tarjetas** con los recursos.

> **¿Va a cambiar textos o enlaces?** Todo el contenido está en `content.json`.
> El paso a paso está en **[MANUAL-IMPLEMENTACION.md](MANUAL-IMPLEMENTACION.md)**.

## Cómo se cambia el contenido

1. Editar `content.json` (admite comentarios `//`).
2. Ejecutar `generar-content.command` con doble clic (o `node tools/generar-content.js`).
   El generador revisa el archivo, avisa si falta un campo, si una tarjeta usa una
   unidad o un tipo que no existe, y crea `js/content.js`.
3. Recargar `index.html` en el navegador.

`js/content.js` se genera solo y queda en modo de solo lectura: no se edita a mano.

## Qué controla `content.json`

| Bloque | Qué define |
| :--- | :--- |
| `courseTitle`, `unitCode` | Título del curso y etiqueta ("Recursos de apoyo") |
| `branding` | Título de la pestaña, fondo de la portada, logos y aviso legal |
| `recursos` | Unidades y tipos del menú superior, textos de los botones y las tarjetas |
| `credits` | Popup de créditos |
| `bibliography` | Popup de bibliografía del dock |
| `features` | Interruptores (por ejemplo, mostrar u ocultar los enlaces de la bibliografía) |

## Estructura de archivos

```
index.html                 Página (no lleva contenido escrito)
content.json               Contenido editable
generar-content.command    Genera js/content.js (doble clic)
css/styles.css             Estilos base (portada, encabezado, dock, popups)
css/ajustes.css            Ajustes de la plantilla
css/movil.css              Ajustes móviles de la plantilla
css/recursos.css           Menú superior y cuadrícula de recursos
js/content.js              Generado a partir de content.json (no editar)
js/data.js                 Publica el contenido y aplica "features"
js/recursos.js             Dibuja el menú superior y las tarjetas
js/app.js                  Portada, transición al menú, dock, popups y progreso
js/bg-texture.js           Textura animada del fondo
js/cursor.js               Cursor personalizado
tools/generar-content.js   Validador y generador
assets/                    Imágenes y logos
```
