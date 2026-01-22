# LevelUp (GitHub Pages) — Paquete listo

Este ZIP trae:
- `index.html` (tu proyecto)
- `assets/` con carpetas para imágenes (personajes / jefes / eventos / ui)

## 1) Crear carpeta assets en GitHub (rápido)
En tu repo:
1. Ve a **Add file → Upload files**
2. Arrastra la carpeta completa `assets/` (aunque esté vacía trae `.gitkeep`)
3. Sube también `index.html`

## 2) Activar GitHub Pages
Repo → **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: `main` / folder: `/ (root)`
Guarda.

## 3) Ruta recomendada para imágenes
### Personajes
Pon tus miniaturas aquí:
`assets/personajes/`

Ejemplos de nombres (elige un estándar y sé consistente):
- `assets/personajes/hero_1.png`
- `assets/personajes/hero_2.jpg`

Luego, en el héroe, guarda una propiedad:
- `photoUrl`: `"assets/personajes/hero_1.png"`

> En esta versión ya agregué soporte: si un héroe trae `photoUrl` o `photoPath`, la miniatura se carga desde ahí
> (sirve perfecto en GitHub Pages y en iPad/celular).

### Jefes / Eventos
- `assets/jefes/`
- `assets/eventos/`

## 4) Nota importante (multidispositivo)
GitHub Pages funciona perfecto para que **todos vean la misma versión** del sitio,
pero **el LocalStorage/IndexedDB de cada dispositivo NO se comparte**.

Si quieres que los alumnos vean *tu* progreso actualizado, lo ideal es:
- Guardar el progreso (estado) en un `data.json` dentro del repo, y que `index.html` lo cargue al abrir.

Cuando quieras, lo implementamos como “modo público” (solo lectura) que lee `data.json`
y tu modo edición sigue guardando localmente (o exporta y reemplaza `data.json` para publicar cambios).
