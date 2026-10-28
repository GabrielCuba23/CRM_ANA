# Validación de la entrega

Verificado el 28 de octubre de 2026 en el entorno cloud, con Node 24.19.0 y Chromium 154.

- Instalación repetible mediante `npm ci` con lockfile: completada.
- Migraciones D1 locales iniciales y segunda ejecución sin cambios: completadas, sin pérdida de datos.
- Compilación Vite y contenedor cloud: completadas.
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

## Actualización cloud 1.2.0

- 24 pruebas unitarias aprobadas, incluidas verificación de origen/source/protocolo/nonce del puente, filtrado de preferencias, manifiesto acotado, títulos solo en memoria de sesión Chrome y contador de escrituras para recargas.
- Los dos recorridos de navegador anteriores y los siete escenarios D1 ampliados vuelven a aprobar tras separar la interfaz.
- Nuevo recorrido de navegador del contenedor cloud: origen ajeno rechazado, entrada por token sin URL, retirada de la sesión antigua del contenedor, contexto por ventana, coincidencia del contacto, limpieza al cerrar, migración del operador, aviso de versión sin descartar borrador, cancelación y confirmación de recarga, datos guardados conservados, preferencias sin campos privados, Excel descargable en iframe y ancho de 420 px sin desbordamiento.
- Se comprueban los encabezados reales del servidor local: raíz no enmarcable, panel solo enmarcable por extensiones, ruta HTML canónica, descriptor sin caché y 404 para rutas inexistentes.
- La prueba de contenedor usa APIs Chrome simuladas y un padre HTTP de prueba. Solo en ese arnés se retira frame-ancestors para embeber la web; se comprueba por separado la política real y se simula el origen de mensaje chrome-extension. No equivale a cargar una extensión real.
- El navegador del entorno bloquea almacenamiento de terceros en ese marco HTTP: se verifica la alternativa en memoria y el retorno del operador mediante el puente. No se elude esa política. El token permanece en el contexto web y puede requerir reingreso tras recargar en este modo.
- Los scripts privilegiados están en el paquete; no se incluyen React, reportes ni módulos remotos en el contexto de extensión. El iframe HTTPS tiene sandbox y no puede invocar comandos arbitrarios de Chrome.
- Se preparan iconos 16/32/48/128, ficha, privacidad pública y guía de publicación No listada. No se ha enviado a revisión ni publicado en Chrome Web Store. La revisión puede requerir cuenta y acceso de prueba aislado, que debe configurar el administrador.

La instalación real de 1.2.0, el almacenamiento del iframe con permisos reales de extensión, WhatsApp real y la implementación remota Pages se verifican en el Chrome y la cuenta del administrador. Las pruebas locales no afirman esa validación externa.

## Web 1.3.0 y lector Chrome 1.2.1

- 27 pruebas unitarias aprobadas: se añaden formato ICS seguro y UTF-8, tiempo UTC/duración/Google, eventos generales en recordatorios/reportes, unidades y compatibilidad del puente con source privilegiado null manteniendo origen y nonce.
- 22 escenarios D1 aprobados: diez originales, siete ampliados y cinco de eventos, revisiones concurrentes, unidades compartidas, borrado de notas y respaldo v3 con restauración de v2.
- Cuatro recorridos de navegador: CRM original, avisos/tareas ampliados, contenedor cloud y Agenda/unidades/bitácora/Tareas unificadas. El contenedor prueba cambio de chat, creación de ficha y selección inmediata.
- El lector pasivo se ejecuta en DOM simulado con encabezado principal y alternativa role=main; conserva el HTML y elige el título por encima del estado en línea.
- Un lector independiente Python icalendar reconoce el archivo descargado, inicio/fin UTC y texto Unicode. Google/Apple/Outlook reales requieren confirmar/importar desde la cuenta o aplicación del usuario; no se crean eventos externos durante las pruebas.
- Migración de eventos aditiva e idempotente verificada sobre una base anterior sin pérdida de contactos. El respaldo incluye las unidades personalizadas y eventos sin contacto.
- El motivo exacto del fallo de la captura no se confirma sin su sesión Chrome. Se añade recuperación del puente, repetición del contexto y lectura periódica sin alterar WhatsApp. El administrador debe recargar también la pestaña WhatsApp tras instalar el lector nuevo.
