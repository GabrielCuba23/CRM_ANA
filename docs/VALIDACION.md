# Validación de la entrega

Verificado el 27 de octubre de 2026 en el entorno cloud, con Node 24.19.0 y Chromium 154.

- Instalación repetible mediante `npm ci` con lockfile: completada.
- Migraciones D1 locales iniciales y segunda ejecución sin cambios: completadas, sin pérdida de datos.
- Compilación Vite y extensión autocontenida: completadas.
- 21 pruebas unitarias: aprobadas (búsqueda, identidad de contacto, minutas, copia JSON, libro Excel, manifiesto, service worker y actualización única de operadores con conservación del historial).
- 17 escenarios API contra D1 local real de Wrangler: aprobados (autenticación, CRUD y conflictos, autoría, presencia, Power BI, respaldo, restauración, validaciones, altas/bajas persistentes de operadores y CORS).
- Recorrido Playwright en navegador: aprobado (login erróneo/correcto, operador, alta de contacto, nota, tarea, casilla completada, reunión y acuerdos, minuta, firma, formato, dos PC con colisión, vista móvil, búsqueda global, Kanban, Excel real de cinco hojas, copia JSON y restauración).
- Lector pasivo ejecutado en DOM simulado de navegador: aprobado; lectura inicial, cambio de título, limpieza al cerrar y comprobación de que no modifica el contenido.
- `npm audit`: cero vulnerabilidades reportadas en las dependencias instaladas, incluidas las de desarrollo.
- Aplicación normal en D1 local (sin datos de las pruebas): HTTP 200 en web y API; cero espacios iniciales, doce operadores tras la primera consulta autenticada y tres formatos reales editables.

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

## Operadores del equipo

- Se verificó la lista inicial de doce nombres, sus acentos y su orden.
- Se verificó la actualización de una base anterior, conservando operadores personalizados, contactos, autoría histórica y asignaciones activas.
- Se verificó que las altas y bajas posteriores no se vuelvan a sustituir y que restaurar un JSON conserve la lista exacta de esa copia.
- En navegador se creó un operador con el botón +, se seleccionó y se comprobó su persistencia tras recargar.

## Recuperación de sincronización (extensión 1.0.1)

- Probados reintento único de consulta HTML 503, no repetición de escrituras HTML 502, respuesta HTML 200, rechazo 403, espera indicada por 429 y cancelación de consultas sin filtrar credenciales.
- En navegador se provocó una respuesta HTML 503 y se comprobó que el estado de conexión y su aviso se recuperan al volver JSON válido.
- Se provocó un fallo HTML 502 al registrar una nota: no hubo reenvío automático, se conservó el borrador y una consulta exitosa no ocultó la falta de confirmación del guardado.
- El aviso original de la captura no aporta código HTTP. No se confirmó la causa de la respuesta de producción: la red del entorno cloud bloquea el destino Pages. La nueva versión permite obtener ese código sin mostrar el contenido HTML ni el token.

## Entrega 1.1.0 y revisión de los 15 apartados

- 21 pruebas unitarias aprobadas: se añaden recordatorios, períodos de reporte, PDF real, tablas dinámicas nativas, proyecto Power BI y actualización aditiva de una base anterior.
- 17 escenarios API D1 aprobados: 10 del CRM anterior y 7 de ficha ampliada, estados/origen de tarea, acuerdos convertibles sin duplicados, avisos/confirmaciones, datos Power BI, copia v2 y compatibilidad de copia v1.
- Dos recorridos completos de navegador aprobados: el CRM anterior y el espacio ampliado. Se probaron dos PC/operadores independientes para envío, recepción y confirmación; tareas, filtros, calendario, recordatorios, PDF, Excel nativo y descarga PBIP.
- Un lector independiente (openpyxl) reconoce las cinco hojas, cinco tablas estructuradas y tres tablas dinámicas con cachés y registros. No se confunde esta prueba con abrir Excel instalado.
- Plantilla PBIP: verificados JSON, tablas TMDL, cinco páginas, relaciones, consultas y ZIP sin token. Su apertura real en Power BI Desktop de Windows queda pendiente.
- WhatsApp permanece intacto, según la decisión expresa del usuario. No se inyectan nombres, filtros ni botones sobre sus mensajes.
- Cero vulnerabilidades reportadas por npm audit tras instalar las dependencias de PDF/OOXML.
