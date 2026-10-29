#!/usr/bin/env node
/**
 * generar-content.js
 * ---------------------------------------------------------------------------
 *  Convierte content.json -> js/content.js  VALIDANDO el contrato primero.
 *
 *  REGLA DE ORO: si la validación falla, NO se escribe js/content.js.
 *  Así el OVA siempre abre con la última versión buena del contenido.
 *
 *  INTEGRIDAD (protege el archivo editable único):
 *    · Escribe un hash del contenido en un manifiesto.
 *    · Si detecta que el content.js anterior fue editado A MANO, avisa y
 *      guarda una copia (content.js.manual.bak) antes de pisarlo.
 *    · Deja content.js en solo lectura (444) para que no se pueda editar por error.
 *
 *  Qué verifica:
 *    · campos obligatorios: courseTitle, unitCode y, por recurso, id, number y slides
 *    · cada slide usa un "type" que existe en js/slides-engine.js
 *    · todas las imágenes declaradas (assets/...) existen en disco
 *
 *  Soporta JSONC: puede dejar comentarios // y de bloque en content.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content.json');
const OUT = path.join(ROOT, 'js', 'content.js');
const BACKUP = path.join(ROOT, 'js', 'content.js.manual.bak');

const SLIDE_TYPES = ['accordion', 'bento', 'carousel', 'featured', 'flipcard',
  'matching', 'question', 'text', 'video'];
const RESOURCE_IMAGE_FIELDS = ['icon', 'modalImage'];
const BRANDING_IMAGE_FIELDS = ['portadaImage', 'logoLeft', 'logoLeftWhite', 'logoRight',
  'logoRightWhite', 'popupLogoLeft', 'popupLogoRight'];

// ------------------------------------------------------- hash (FNV-1a 32bit)
// Sincrónico y sin dependencias. Es control de integridad, NO criptografía:
// sirve para detectar ediciones accidentales, no para thwarting a un atacante.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ('00000000' + h.toString(16)).slice(-8);
}

const errors = [];
const warnings = [];
const err = (p, m) => errors.push(`${p}: ${m}`);
const warn = (p, m) => warnings.push(`${p}: ${m}`);

// ---------------------------------------------------------------- JSONC -> JSON
function stripComments(text) {
  let out = '', i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') { if (text[j] === '\\') j++; j++; }
      out += text.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      const e = text.indexOf('\n', i); i = e === -1 ? text.length : e; continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      const e = text.indexOf('*/', i + 2); i = e === -1 ? text.length : e + 2; continue;
    }
    out += c; i++;
  }
  return out;
}

// ---------------------------------------------------------------- validación
function validateImage(value, where) {
  if (typeof value !== 'string' || !value.trim()) return;
  if (!value.startsWith('assets/')) { warn(where, `ruta fuera de assets/: "${value}"`); return; }
  if (!fs.existsSync(path.join(ROOT, value))) err(where, `la imagen no existe: ${value}`);
}

function validateSlide(slide, where) {
  if (typeof slide !== 'object' || slide === null) return err(where, 'no es un objeto');
  if (!slide.type) return err(where, 'falta "type"');
  if (!SLIDE_TYPES.includes(slide.type)) {
    return err(`${where}.type`, `"${slide.type}" no existe.\n` +
      `        Válidos: ${SLIDE_TYPES.join(', ')}`);
  }
  ['image', 'icon', 'heroIcon'].forEach(f => validateImage(slide[f], `${where}.${f}`));
  if (Array.isArray(slide.cards)) {
    slide.cards.forEach((c, i) => validateImage(c && c.icon, `${where}.cards[${i}].icon`));
  }
  if (slide.type === 'video' && !slide.youtubeUrl) err(`${where}.youtubeUrl`, 'el video necesita "youtubeUrl"');
}

function validateResource(res, where) {
  if (typeof res !== 'object' || res === null) return err(where, 'no es un objeto');
  ['id', 'number'].forEach(k => { if (!res[k]) err(`${where}.${k}`, 'falta este campo obligatorio'); });
  RESOURCE_IMAGE_FIELDS.forEach(f => validateImage(res[f], `${where}.${f}`));
  if (!Array.isArray(res.slides)) {
    err(`${where}.slides`, 'falta la lista "slides": [ ... ] con el contenido del modal');
  } else {
    if (!res.slides.length) warn(`${where}.slides`, 'lista vacía: el modal se verá sin contenido');
    res.slides.forEach((s, i) => validateSlide(s, `${where}.slides[${i}]`));
  }
}

function validate(data) {
  if (typeof data !== 'object' || data === null) { err('raíz', 'el archivo no contiene un objeto JSON'); return; }
  ['courseTitle', 'unitCode'].forEach(k => { if (!data[k]) err(k, 'falta este campo obligatorio'); });
  validateImage(data.heroImage, 'heroImage');
  const brand = data.branding || {};
  BRANDING_IMAGE_FIELDS.forEach(f => validateImage(brand[f], `branding.${f}`));
  if (!Array.isArray(data.resources)) err('resources', 'debe ser una lista');
  else {
    if (!data.resources.length) err('resources', 'la lista está vacía');
    data.resources.forEach((r, i) => validateResource(r, `resources[${i}]`));
  }
  if (data.bibliography && Array.isArray(data.bibliography.entries)) {
    data.bibliography.entries.forEach((e, i) => {
      const u = e && e.url;
      if (u !== null && u !== undefined && typeof u !== 'string') {
        err(`bibliography.entries[${i}].url`, 'debe ser un texto o null');
      }
    });
  }
  ['credits', 'bibliography'].forEach(k => {
    if (!data[k]) return;
    validateImage(data[k].iconSrc, `${k}.iconSrc`);
    validateImage(data[k].supportImageSrc, `${k}.supportImageSrc`);
  });
}

// ------------------------------------------- detectar edición manual previa
// Verifica el archivo generado anterior. Para comparar hay que parsear el
// literal y hashear la forma COMPACTA, igual que hace el runtime en data.js
// (si se hasheara el texto crudo del archivo, nunca coincidiria por la indentacion).
function readExistingManifest() {
  if (!fs.existsSync(OUT)) return null;
  const raw = fs.readFileSync(OUT, 'utf8');
  const m = raw.match(/contentSha256:\s*([0-9a-f]+)/);
  if (!m) return null;
  const start = raw.indexOf('window.OVA_CONTENT = ');
  if (start === -1) return null;
  const literal = raw.slice(start + 'window.OVA_CONTENT = '.length).replace(/;\s*$/, '');
  let parsed;
  try { parsed = JSON.parse(literal); } catch (e) {
    return { declared: m[1], actual: 'ilegible', raw };
  }
  return { declared: m[1], actual: hash(JSON.stringify(parsed)), raw };
}

// ---------------------------------------------------------------- generación
function main() {
  const C = { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[1m', d: '\x1b[2m', x: '\x1b[0m' };
  const say = s => process.stdout.write(s + '\n');
  const force = process.argv.includes('--force');

  if (!fs.existsSync(SRC)) { say(`${C.r}No existe content.json${C.x}`); process.exit(1); }

  let data;
  try {
    data = JSON.parse(stripComments(fs.readFileSync(SRC, 'utf8')));
  } catch (e) {
    say(`${C.r}${C.b}content.json tiene un error de sintaxis${C.x}`);
    say(`  ${e.message}`);
    say(`\n${C.d}No se generó nada. El OVA sigue con la última versión buena.${C.x}`);
    process.exit(1);
  }

  validate(data);
  if (warnings.length) {
    say(`${C.y}${C.b}Advertencias:${C.x}`);
    warnings.forEach(w => say(`  ${C.y}·${C.x} ${w}`));
    say('');
  }
  if (errors.length) {
    say(`${C.r}${C.b}content.json tiene ${errors.length} error(es):${C.x}`);
    errors.forEach(e => say(`  ${C.r}·${C.x} ${e}`));
    say(`\n${C.d}No se generó nada. El OVA sigue con la última versión buena.${C.x}`);
    process.exit(1);
  }

  // --- detectar si el content.js anterior fue editado a mano ---
  const prev = readExistingManifest();
  let manualWarning = false;
  if (prev && prev.declared !== prev.actual) {
    manualWarning = true;
    say(`${C.r}${C.b}✗ js/content.js fue editado A MANO${C.x}`);
    say(`  El generador lo había escrito con el hash ${C.d}${prev.declared}${C.x},`);
    say(`  pero ahora tiene ${C.d}${prev.actual}${C.x}.`);
    if (!force) {
      fs.writeFileSync(BACKUP, prev.raw);
      say(`\n  ${C.y}Guardé una copia de tu versión en:${C.x}`);
      say(`  ${C.d}js/content.js.manual.bak${C.x}`);
      say(`\n  ${C.b}No se sobrescribió.${C.x} Si quiere regenerar y descartar esos cambios:`);
      say(`  ${C.d}node tools/generar-content.js --force${C.x}`);
      say(`\n  Para NO perder trabajo: portá tus cambios a ${C.b}content.json${C.x} y después regenerá.`);
      say(`\n${C.d}Recuerde: el archivo editable es content.json. content.js lo genera la máquina.${C.x}`);
      process.exit(1);
    }
    say(`  ${C.y}· --force: regenerando igual (tu copia quedó en js/content.js.manual.bak)${C.x}`);
    say('');
  }

  const canonical = JSON.stringify(data, null, 2);   // con indentación: va al archivo
  const compact = JSON.stringify(data);              // sin indentación: es lo que hashea el runtime
  const contentHash = hash(compact);
  const prevHash = prev && prev.declared === prev.actual ? prev.declared : null;
  const changed = prevHash !== null ? prevHash !== contentHash : true;

  const banner = [
    '/**',
    ' * ===========================================================================',
    ' *  ARCHIVO GENERADO - NO EDITAR A MANO',
    ' * ===========================================================================',
    ' *  Fuente de verdad: content.json     Generador: ./generar-content.command',
    ' *',
    ' *  Para cambiar contenido (imagenes, titulos, slides, botones, links),',
    ' *  edita  content.json  y corré el generador.',
    ' * ===========================================================================',
    ' *',
    ` *  contentSha256: ${contentHash}`,
    ` *  generatedAt:   ${new Date().toISOString()}`,
    ' */',
    ''
  ].join('\n');

  const meta = `window.OVA_CONTENT_META = { contentSha256: ${JSON.stringify(contentHash)}, generatedAt: ${JSON.stringify(new Date().toISOString())} };\n`;
  const body = `${meta}window.OVA_CONTENT = ${canonical};\n`;

  try { fs.chmodSync(OUT, 0o644); } catch (_) { /* no existe todavia */ }
  fs.writeFileSync(OUT, banner + body);
  try { fs.chmodSync(OUT, 0o444); } catch (_) { /* sistema sin permisos */ }

  say(`${C.g}${C.b}✓ js/content.js generado${C.x}  ${C.d}${new Date().toLocaleString('es-CO')}${C.x}`);
  say(`  recursos: ${data.resources.length}   slides: ${data.resources.reduce((n, r) => n + (r.slides ? r.slides.length : 0), 0)}`);
  say(`  hash: ${C.d}${contentHash}${C.x}  ${changed ? `${C.g}(contenido actualizado)${C.x}` : `${C.d}(sin cambios)${C.x}`}`);
  say(`  modo: ${C.d}444 solo lectura${C.x}`);
  if (manualWarning) say(`  ${C.y}· tu versión editada a mano quedó en js/content.js.manual.bak${C.x}`);
  say(`${C.d}  Recargue index.html para ver los cambios.${C.x}`);
}

main();