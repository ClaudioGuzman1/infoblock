# Soy IDC – Órdenes de Servicio

Webapp estática (GitHub Pages). Sin build: se sirve tal cual.

## Estructura
```
index.html            Shell mínimo: carga CSS y scripts (defer, en orden)
styles.css            Estilos
js/core/              image-store (IndexedDB), database, toast, config (Supabase), utils, state
js/orders.js          Lógica de órdenes locales e imágenes
js/pdf/               assets (base64 compartido) + ods / idt / cde
js/views/             render, lista, formulario y pestañas
js/features/          firmas, entregas, backup (exportar/importar/combinar)
js/cloud/             api (REST/Storage), print, view, edit
js/main.js            Arranque
tests/                Pruebas (node:test + jsdom)
```

## Pruebas
```
npm install
npm test                # contra la app refactorizada (raíz)
npm run test:original   # las MISMAS pruebas contra el index.html original
```

## Publicar cambios
El service worker sirve `.js`/`.css` desde caché primero. Al cambiar cualquier
archivo de `js/` o `styles.css`, **sube el `?v=` en `index.html`** para que los
usuarios reciban la versión nueva.

## Copiar un ticket de la Nube al dispositivo
En la vista **Nube**, el botón **📥 Local** (fila) o **Copiar a local** (detalle) descarga todas las
imágenes y firmas del registro y crea una orden local vinculada (`cloudId`). Se edita normalmente
(agregar fotos de la galería, cambiar datos) y **☁️ Guardar en Nube** actualiza el mismo registro.
- Las imágenes locales ahora se guardan en IndexedDB y sobreviven a cerrar o recargar la app.
- Si alguna descarga falla no se crea la copia (evita perder imágenes al volver a subir).
