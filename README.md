# Tomi Peluquería Canina (Frontend)

Sitio estático premium (HTML, CSS, JS) listo para GitHub Pages. El canal de venta es WhatsApp.

## Cómo correr local
- Opción recomendada: abrir la carpeta con VS Code y usar Live Server.
- Opción simple: abrir `index.html` en el navegador.

## Publicar en GitHub Pages
1. Subí el repo a GitHub.
2. En Settings > Pages, seleccioná la rama `main` y la carpeta `/root`.
3. Guardá y esperá a que se publique.
4. Reemplazá los links `https://example.github.io/TomyPeluqueriaCaninca/` en `sitemap.xml`, `robots.txt` y las etiquetas canonical de cada página.

## Configurar Google Sheets (productos, servicios, estaticos, galeria y extras)
Este sitio carga datos desde Google Sheets y usa fallback local si falla.

### Paso 1: publicar la planilla
- Abrí el Sheet y andá a `Archivo > Publicar en la web`.
- Publicá toda la planilla o al menos las hojas `productos`, `servicios`, `estaticos`, `galeria`, `horario`, `sobre_tomi`, `venta`, `faq` y `animacion`.

### Paso 2: URLs CSV recomendadas
- Productos:
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=productos`
- Servicios:
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=servicios`
- Estaticos (imágenes para "Cuidamos a tu mascota"):
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=estaticos`
- Galería (imágenes o videos):
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=galeria`
- Horario:
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=horario`
- Sobre Tomi:
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=sobre_tomi`
- Venta:
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=venta`
- FAQ:
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=faq`
- Animacion:
  `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=animacion`

### Paso 3: ID del Sheet y nombre de hojas
- El ID actual está configurado en `js/main.js`.
- Si usás `gid`, agregá el valor en `CONFIG.sheets.productos.gid`, `CONFIG.sheets.servicios.gid`, `CONFIG.sheets.estaticos.gid`, `CONFIG.sheets.galeria.gid`, `CONFIG.sheets.horario.gid`, `CONFIG.sheets.sobre_tomi.gid`, `CONFIG.sheets.venta.gid`, `CONFIG.sheets.faq.gid` o `CONFIG.sheets.animacion.gid`.

## Formato flexible de datos
- Productos: `nombre`, `descripcion`, `precio`, `imagen`, `categoria`.
- Servicios: `nombre`, `descripcion`, `precio`, `duracion`, `categoria`, `imagen`.
- Estaticos: `imagen`, `texto`.
- Galería: `titulo`, `archivo`.
- Horario: `inicio`, `cierre`.
- Sobre Tomi: `descripcion`.
- Venta: `elementos`.
- FAQ: `pregunta`, `respuesta`.
- Animacion: `animacion` (poner `si` para activar).

Si falta algún campo, la UI sigue funcionando.

## Cambiar colores y textos
- Paleta y estilos: `css/styles.css`.
- Textos principales: `index.html` y demás páginas.

## Imágenes y OpenGraph
- Imagen OG placeholder: `assets/img/og-cover.jpg`.
- Reemplazala por una foto real (1200x630 recomendado).
- Si usas fotos en Sheets, completa la columna `imagen` con URLs públicas.

## Archivos principales
- HTML: `index.html`, `catalogo.html`, `servicios.html`, `como-reservar.html`.
- JS: `js/main.js`, `js/ui.js`, `js/sheets.js`.
- Fallback data: `data/productos.json`, `data/servicios.json`, `data/estaticos.json`, `data/galeria.json`, `data/horario.json`, `data/sobre_tomi.json`, `data/venta.json`, `data/faq.json`, `data/animacion.json`.
