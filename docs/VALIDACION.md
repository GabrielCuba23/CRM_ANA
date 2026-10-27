# Validación de la entrega

Verificado el 27 de octubre de 2026 en el entorno cloud, con Node 24.19.0 y Chromium 154.

- Instalación repetible mediante `npm ci` con lockfile: completada.
- Migraciones D1 locales iniciales y segunda ejecución sin cambios: completadas, sin pérdida de datos.
- Compilación Vite y extensión autocontenida: completadas.
- 7 pruebas unitarias: aprobadas (búsqueda, identidad de contacto, minutas, copia JSON, libro Excel, manifiesto y service worker).
- 9 escenarios API contra D1 local real de Wrangler: aprobados (autenticación, CRUD y conflictos, autoría, presencia, Power BI, respaldo, restauración, validaciones y CORS).
- Recorrido Playwright en navegador: aprobado (login erróneo/correcto, operador, alta de contacto, nota, tarea, casilla completada, reunión y acuerdos, minuta, firma, formato, dos PC con colisión, vista móvil, búsqueda global, Kanban, Excel real de cinco hojas, copia JSON y restauración).
- Lector pasivo ejecutado en DOM simulado de navegador: aprobado; lectura inicial, cambio de título, limpieza al cerrar y comprobación de que no modifica el contenido.
- `npm audit`: cero vulnerabilidades reportadas en las dependencias instaladas, incluidas las de desarrollo.
- Aplicación normal en D1 local (sin datos de las pruebas): HTTP 200 en web y API; cero espacios iniciales, cuatro integrantes y tres formatos reales editables.

## Pendiente de validación externa

- Carga real de la extensión, Side Panel, permisos de dominio y WhatsApp real: no ejecutados. Chromium de este entorno rechaza extensiones descomprimidas por política administrativa. No se eludió esa política. Las pruebas del service worker y lector usan runtimes/DOM simulados y no equivalen a validar WhatsApp real.
- Despliegue remoto Cloudflare Pages/D1 y conexión desde Power BI Desktop: no ejecutados; no hay credenciales Cloudflare vinculadas. La respuesta JSON de Power BI sí se verificó con D1 local.
- GitHub Actions: se incluye el flujo CI, sin afirmar que haya corrido en GitHub.

El ZIP se prepara con Python y se comprueba con `ZipFile.testzip`. Excluye secretos, sesión, datos locales y node_modules. La configuración reutilizable del entorno cloud guarda install_script y start_skill como borrador, sin publicar automáticamente.

## Identidad visual ANA

- Logo original aportado por el usuario en `LOGO ANA AZUL.zip`, conservado byte por byte en `src/assets/ana-logo.png` (929 × 412, transparencia original).
- Azul principal extraído del archivo: `#2957A4`.
- Verificado en navegador: acceso, barra lateral y cabecera adaptable a 1440, 850, 601, 450 y 380 píxeles, con imagen cargada, proporción conservada y sin desbordamiento horizontal.
- El PNG compilado de la web y el de la extensión coinciden byte por byte con el original.
- Compilación y recorrido completo de navegador aprobados después de integrar el logo.
