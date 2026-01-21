# LevelUp — GitHub Pages Pack (HTML + Assets)

Este paquete ya está listo para subirse a GitHub y publicarse con **GitHub Pages**.

## Estructura
- `index.html` — la app (modo web)
- `assets/` — imágenes (aquí van TODOS los artes de jefes/eventos)
- `.nojekyll` — evita que GitHub Pages modifique archivos

## Publicar en GitHub Pages (paso a paso)
1) En GitHub crea un repo, por ejemplo: `levelup`.
2) Sube **todo** el contenido de esta carpeta (index.html, assets/, .nojekyll).
3) Ve a **Settings → Pages**:
   - **Source**: *Deploy from a branch*
   - **Branch**: `main` / `(root)`
4) Guarda y abre la URL que te da GitHub Pages.

## Agregar más imágenes
- Copia nuevas imágenes dentro de `assets/`
- En el código, referencia así: `assets/mi_imagen.png`
- Vuelve a subir/commit y listo (los cambios se ven en tu link).

## Abrir en iPad / Android como “app”
- Abre el link en Safari/Chrome
- iOS: botón compartir → **Agregar a pantalla de inicio**
- Android: menú → **Instalar app** (o Agregar a pantalla de inicio)

## Nota importante (modo alumnos)
GitHub Pages es **público**. Si quieres que los alumnos solo vean:
- deja el **PIN de edición** solo contigo
- (más adelante) se puede hacer un “modo alumno” que oculte botones de edición y evite cambios.

Si en el futuro quieres que cada alumno vea SU progreso desde cualquier dispositivo, necesitarás sincronización (backend) o export/import por archivo.
