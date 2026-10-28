# CRM & Agenda Cloud de Coordinación Institucional ·

Aplicación React + Tailwind para navegador y Chrome Side Panel, Pages Functions y D1. El mismo repositorio construye la web en `dist/` y una extensión Manifest V3 ligera en `extension-dist/`, que muestra la aplicación HTTPS aislada de Cloudflare. No requiere el celular maestro para gestionar contactos. No es un producto oficial de ANA ni de Meta.

La [guía de capacitación interactiva](docs/capacitacion/README.md) incluye una presentación PowerPoint descargable con las funciones actuales, instalación en cada PC, ejercicios y soluciones a problemas frecuentes.

## Versión 1.1.0: revisión del alcance

Consulta [la revisión de los 15 apartados](docs/REVISION_15_FUNCIONES.md), basada en el Word entregado y las decisiones confirmadas. Incluye avisos entre operadores, ficha institucional ampliada, tablero global de tareas, calendario, acuerdos con responsables, recordatorios, reportes PDF/Excel con tablas dinámicas y proyecto Power BI .pbip. WhatsApp sigue siendo de solo lectura; las adaptaciones se hacen en el panel.

## Requisitos

- Node.js 24 (versión verificada: 24.19.0), npm y Python 3 para empaquetar y generar el secreto local.
- Chrome 116 o superior para Side Panel. Navegadores modernos para la web.
- Cuenta Cloudflare con Pages y D1 para producción. GitHub para el despliegue desde Git.
- HTTPS en producción; conexión a Internet para consultar y escribir. No se guardan escrituras pendientes fuera de línea.

## Inicio local

Ejecuta desde la raíz del repositorio:

```bash
npm ci
python3 scripts/local-secret.py
npm run db:migrate
npm run build
npm run preview
```

`preview` sirve la web y la API local en el puerto 8788. Abre esa dirección en tu navegador y usa el token de tu archivo privado `.dev.vars` para entrar. El script genera un token local aleatorio, no lo imprime ni lo agrega a Git. En esta máquina de desarrollo ya existe dicho archivo. No lo publiques ni lo compartas en chat.

Para React con recarga automática, deja `npm run preview` ejecutándose y abre otra terminal con `npm run dev`. Vite usa el puerto 5173 y reenvía `/api` al puerto 8788. Ambos comandos deben ejecutarse desde la raíz del proyecto.

El archivo ignorado `wrangler.local.toml` se genera con un UUID exclusivo de la base **local**. Las migraciones y el servidor usan ese mismo identificador. Nunca lo copies a la configuración de producción. Los datos normales quedan en `.wrangler/state`; las pruebas crean bases independientes. Ejecutar migraciones nuevamente no borra registros.

## Desplegar en Cloudflare

No hay identificadores de cuenta, tokens ni UUID de base inventados en los archivos. La configuración remota debe vincular tu D1 real:

1. Ejecuta `npx wrangler login` en tu equipo para autorizar Cloudflare. En CI usa `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` desde secretos, sin guardarlos en Git.
2. Ejecuta `npx wrangler d1 create crm_ana_db`. Copia el UUID que entrega Cloudflare. En una terminal Bash registra ese UUID mediante:

   ```bash
   read -r -p 'UUID real de D1: ' D1_ID
   npm run configure:d1 -- "$D1_ID"
   npm run db:migrate:remote
   ```

3. Crea el proyecto Pages: `npx wrangler pages project create crm-whatsapp-ana --production-branch main`.
4. Crea un token maestro aleatorio de al menos 32 bytes con tu gestor de contraseñas. Regístralo mediante `npx wrangler pages secret put TEAM_TOKEN --project-name crm-whatsapp-ana`. La CLI solicita el valor de forma interactiva; no lo pegues en el código. Comparte el token con los operadores mediante un canal privado.
5. Ejecuta `npm run deploy`. El binding `DB` se toma de `wrangler.toml`, donde `configure:d1` registró el UUID real. Alternativamente, conecta GitHub en Pages: comando de compilación `npm run build`, directorio de salida `dist`, rama `main`, Node 24, secreto `TEAM_TOKEN` y base D1 vinculada como `DB`.
6. Si usas entornos de vista previa, vincula una D1 separada y un token distinto en Preview. No apuntes pruebas o vistas previas a producción.
7. Abre la URL que entrega Pages e ingresa con el token maestro. Selecciona el operador de esta PC y crea el primer espacio. Prueba en tu cuenta crear una nota, descargar un Excel y exportar/restaurar un respaldo en una base de prueba antes de operar datos reales.

**Las Pages Functions deben compilarse y desplegarse desde el repositorio con Wrangler o la integración Git. Subir únicamente `dist` con arrastrar y soltar no instala la API.**

Si agregas un dominio personalizado, el navegador usa automáticamente ese mismo origen para `/api`. La extensión 1.2.0 apunta exclusivamente a `https://crm-whatsapp-ana.pages.dev`; un dominio distinto requiere configurar y publicar otra versión del contenedor con ese origen exacto en manifiesto, protocolo, HTML y política de permisos del iframe. No acepta URLs arbitrarias. `ALLOWED_ORIGINS` es opcional y acepta orígenes adicionales separados por comas; la web del mismo origen y los orígenes Chrome Extension ya se admiten. No se usa CORS `*`.

## Instalar el modo oficina

1. Compila con `npm run build` o usa `extension-dist/` del ZIP entregado.
2. En Chrome abre el administrador de extensiones, activa modo desarrollador y usa **Cargar descomprimida**, seleccionando `extension-dist/`.
3. Fija la extensión, abre WhatsApp Web y pulsa el icono CRM ANA para abrir el Side Panel.
4. El panel carga automáticamente el CRM de Cloudflare. Introduce únicamente el token del equipo. La sesión anterior de la extensión local no se transfiere; el token nunca cruza el puente.
5. Elige «¿Quién opera esta PC?». Ajusta manualmente el ancho del panel entre 380 y 450 px; Chrome administra el ancho y no permite fijarlo desde el manifiesto.

El lector observa únicamente el encabezado activo (`#main header` y alternativas semánticas) y transmite el texto del título. Comprueba cambios también cada dos segundos sin modificar WhatsApp. No agrega botones, no cambia atributos, no escribe chats, no lee la lista de mensajes ni envía mensajes. La API de WhatsApp no forma parte del proyecto. La detección depende del DOM disponible: si Meta cambia el encabezado, puede dejar de detectar; el directorio manual sigue disponible.

Los teléfonos se normalizan quitando espacios y signos, sin inventar prefijos internacionales. Usa código de país. Un encabezado con nombre guardado no revela necesariamente el número real; los grupos no exponen un ID estable en su título. La coincidencia por nombre solo se abre automáticamente si es única. Ante duplicados o falta de coincidencia se pide seleccionar un espacio o crear uno con el teléfono/ID conocido. Nunca se asignan espacios por similitud aproximada.

`Abrir borrador en WhatsApp` abre un enlace oficial con texto preparado. Para grupos el destinatario se elige manualmente. No confirma ni automatiza el envío. La bitácora registra «borrador abierto» o «texto copiado», sin afirmar que el mensaje se entregó.

## Actualizar la extensión

La versión 1.2.0 separó el CRM web del contenedor. La entrega actual incluye web 1.3.0 y contenedor 1.2.1. Instálalo **una vez en cada PC**: cierra el panel, sustituye los archivos de su carpeta por el ZIP nuevo y pulsa **Recargar** en `chrome://extensions`. La tarjeta debe mostrar 1.2.1. Recarga también WhatsApp Web para activar el lector nuevo. Elige tu operador y vuelve a ingresar el token en el sitio Cloudflare. Los registros D1 no cambian.

Después, los cambios de React, estilos, reportes y API se publican en GitHub y se despliegan en Pages; no requieren repartir ZIPs nuevos. Al abrir el panel se carga el despliegue actual. Si ya estaba abierto, consulta la versión cada minuto y al volver a la pestaña; muestra **Actualizar CRM**. El aviso no recarga automáticamente ni descarta borradores; el usuario guarda y confirma la recarga. Las escrituras pendientes impiden recargar mediante ese botón. El control **Recargar** del contenedor pide confirmar antes de recargar manualmente.

Los cambios de permisos, scripts de WhatsApp, puente o dominio del contenedor sí necesitan una versión de extensión. Para distribuir esas versiones automáticamente, publica el ZIP como **No listada** en Chrome Web Store y usa su enlace de instalación en cada PC. Las instalaciones descomprimidas no se convierten automáticamente en instalaciones de tienda. La publicación y aprobación no se han realizado por el hecho de generar el ZIP.

Consulta [guía completa de actualización y publicación](docs/ACTUALIZACIONES_CLOUD.md) y [ficha preparada para la tienda](store/FICHA_TIENDA.md). La política de privacidad está en `/privacy.html` del sitio. El paquete incluye iconos PNG de 16, 32, 48 y 128 px y un manifiesto con solo dos permisos y dos orígenes exactos.

Las consultas fallidas por red o errores temporales se reintentan una sola vez; no se superponen consultas de sincronización. Al recuperarse la lectura, se retira el aviso correspondiente. Los guardados no se reintentan automáticamente ni se consideran confirmados por una lectura posterior. Si el servidor devuelve HTML en vez de JSON, el aviso muestra el código HTTP y una indicación para comprobar la conexión o la configuración.

Consulta también [novedades y uso de la web 1.3.0](docs/NOVEDADES_1.3.md): Tareas con Lista/Kanban, creación de eventos, Google/ICS, eliminación de notas, unidades personalizadas y recuperación del chat.

## Operadores del equipo

La lista inicial contiene Hanz, Fernando, Acxel, Andrés, Shirley, Jaruska, Marco, Alejandra, Marcelo, Luciano, Sheila y Cristina. Selecciona tu nombre en «¿Quién opera esta PC?». Para agregar más personas, pulsa el botón **+** junto al selector, escribe el nombre y pulsa **Crear operador**; el cambio se guarda en D1 y se comparte con todas las PC.

En una base ya existente, la API actualiza la lista una sola vez al recibir una consulta autenticada. Conserva operadores personalizados y los nombres anteriores que aún tengan espacios o tareas pendientes asignados. Las altas y bajas posteriores no se reinician al sincronizar. Las notas mantienen su autor histórico, y una restauración JSON respeta la lista exacta del respaldo.

## Operación del equipo

- El token compartido autentica al **equipo**. El selector identifica al operador por declaración y no es una identidad criptográficamente verificada. Cualquier poseedor del token tiene acceso total, incluida restauración. Este modelo cumple acceso maestro compartido, pero no reemplaza permisos individuales, MFA ni auditoría inalterable.
- El token vive en `sessionStorage` de la página HTTPS del CRM, tanto en navegador como dentro del panel, no se incluye en respaldos ni en el ZIP. El operador, ID de dispositivo, firma y origen API se conservan en `localStorage`. Cerrar sesión borra el token; cerrar la sesión del navegador puede requerir volver a ingresarlo. Cambiar `TEAM_TOKEN` en Pages y volver a desplegar revoca el acceso del token anterior.
- Cada pestaña/panel tiene un identificador de sesión y cada perfil de navegador un identificador de dispositivo. Dos perfiles en la misma máquina pueden aparecer como dos PC. Los latidos son cada 4 segundos y expiran a los 15 segundos. No son bloqueos de edición. Se informa cuando no se puede actualizar la presencia.
- El estado de la agenda se refresca cada 12 segundos y después de cada escritura. La detección de colisión usa un endpoint independiente que devuelve solo presencia, sin descargar toda la base cada cuatro segundos.
- Los espacios verifican su fecha de actualización para evitar sobrescribir una edición concurrente. Una nota también actualiza el espacio. Ante conflicto actualiza y vuelve a abrir el formulario. Tareas, reuniones y formatos usan última escritura; la cinta de presencia avisa del trabajo paralelo.
- Cada registro de Bitácora permite Eliminar nota con confirmación. La eliminación se comparte con todo el equipo y actualiza el contacto; no es un registro inmutable.
- Sede Central y Prensa están en Órgano/Unidad; Añadir órgano/unidad permite registrar más opciones compartidas y usarlas como filtro.
- Cada nota lleva autor del operador, tareas y reuniones llevan autor y último operador, y los formatos firmados se registran como nota al copiar/abrir borrador. Las marcas de tiempo se generan en el servidor; reuniones y presentación usan hora de Perú.
- Para eliminar un integrante, reasigna sus espacios y tareas pendientes primero. La autoría histórica permanece. Conserva al menos un integrante.
- Contactos y su información relacionada se guardan en D1, independientemente de la libreta del teléfono que escaneó WhatsApp.

Los comandos `/drive`, `/tdr` y `/cut` se instalan como formatos iniciales editables. `/drive` abre el servicio general de Google Drive; sustituye su contenido por el enlace real de la carpeta del equipo cuando la tengas.

## Avisos internos, agenda y tareas

Desde el espacio de un contacto pulsa **Avisar a otro operador**. Elige al compañero y escribe qué necesita el contacto. El aviso se registra en D1 y en la bitácora. La campana muestra la bandeja; el destinatario puede marcar leído, abrir el contacto y confirmar **Recibido**. El remitente ve la confirmación en Enviados. La bandeja consulta cada cinco segundos mientras el CRM está abierto; los avisos permanecen guardados para el operador desconectado. Se muestran hasta 100 por bandeja, priorizando los no leídos; el respaldo conserva el historial completo. La identidad sigue basada en el selector compartido, sin cuentas individuales ni garantía criptográfica de autoría.

En **Tareas** hay una única sección con vistas Lista y Tablero Kanban sobre los mismos registros, con Por hacer, En proceso, En revisión y Completado, filtrable por integrante y estado. Pega el texto de WhatsApp en el formulario para convertirlo; para audios o documentos registra la transcripción o referencia. Se conserva el origen sin añadir botones o leer mensajes de WhatsApp.

En **Agenda** hay calendario mensual, lista de reuniones y **Nuevo evento** con inicio/fin, descripción y contacto opcional. Cada evento ofrece Google Calendar para confirmar Guardar, y un archivo .ics para Apple, Outlook y otros calendarios. Se puede exportar la selección visible. No es sincronización bidireccional ni envío automático de invitaciones. Desde cada contacto puedes agendar enlace o sala presencial, marcar Programada/Realizada/Cancelada y añadir acuerdos con responsable/fecha. **Crear tareas de acuerdos** es idempotente. Los acuerdos que ya tengan tareas se gestionan desde Tareas para evitar duplicados y vínculos ambiguos.

La campana contiene recordatorios en pantalla de reuniones próximas (15 minutos), tareas próximas (una hora) y vencidas. Requieren CRM abierto y operador seleccionado. Una fecha de tarea sin hora vence a las 17:00 de Perú; si registras fecha/hora se respeta esa hora. Descartar un recordatorio se conserva en esta PC por operador. No se instalan servicios de fondo ni se envían mensajes externos.

## Centro de datos

El Excel usa SheetJS 0.20.3 y genera cinco tablas estructuradas y tres tablas dinámicas nativas con campos y cachés OOXML. La hoja de resumen incluye carga de tareas por operador/estado, coordinaciones por órgano/estado y reuniones por contacto/estado. Puedes reorganizarlas en Excel. El libro conserva exactamente `1_Resumen_KPIs`, `2_Agenda_Espacios`, `3_Tareas_y_CUTs`, `4_Bitacora_Historica` y `5_Reuniones_Acuerdos`. No ejecuta fórmulas con texto de notas: los textos se escriben como celdas de texto. Se carga de forma diferida para reducir el JavaScript inicial.

La dependencia `xlsx` es un alias al espejo npm `@e965/xlsx@0.20.3`, que distribuye SheetJS CE bajo Apache-2.0. Se usa un espejo comunitario porque el CDN oficial no está permitido en la red de este entorno. La versión y la integridad están fijadas en `package-lock.json`; no se usa el paquete npm `xlsx@0.18.5`, con vulnerabilidades conocidas. Revisa esta decisión de cadena de suministro según la política de tu organización. `THIRD_PARTY_NOTICES.md` contiene la atribución.

El Centro de datos permite elegir semana, mes, intervalo e integrante para Excel/PDF. Los pendientes anteriores al período se conservan para no perder trabajo abierto; el respaldo JSON siempre es completo.

El proyecto Power BI descargable está en `powerbi/CRM_ANA.pbip` y `public/powerbi/CRM_ANA_PowerBI.pbip.zip`. Tiene cinco páginas, modelo TMDL, medidas DAX, relaciones y parámetros para API o Excel estructurado. Abre el .pbip en Power BI Desktop de Windows, configura los parámetros y puedes guardarlo como .pbix. Su estructura se verifica aquí; la apertura/ejecución en Power BI Desktop requiere validación en Windows. No se entrega un PBIX binario ni se afirma una validación de ese programa. El modelo de Importación se actualiza al refrescar, no por streaming.

El conector Power BI muestra/copia la URL real de la instancia con el token codificado. La respuesta incluye `Resumen_KPIs`, `Agenda_Espacios`, `Tareas_y_CUTs`, `Bitacora_Historica` y `Reuniones_Acuerdos`. Al conectar elige cada lista y conviértela en tabla en Power Query. La URL es una credencial: puede quedar en el historial, el archivo PBIX y registros del proveedor. El endpoint no acepta token por URL para ningún otro recurso. Usa cabecera `X-Team-Token` en integraciones que la permitan.

La copia JSON v3 incluye eventos generales y vinculados, órganos/unidades personalizados, además de contactos y datos institucionales, notas, tareas con estado y origen, reuniones con acuerdos, formatos, operadores, avisos internos y vínculos de acuerdos con tareas. Mantiene compatibilidad con copias v1 y v2. Incluye un identificador de aplicación y versión de esquema. La restauración comprueba campos, enlaces, referencias, duplicados y tamaños **antes** de modificar datos, y ejecuta borrado e inserción en un único `DB.batch` atómico. Se descarga una copia de seguridad del estado anterior antes de restaurar desde la UI. Se excluye presencia porque es temporal. La copia no incluye cuenta Cloudflare, token, dominio, ni UUID: el nuevo administrador configura su propio Pages/D1 y restaura el JSON.

Límite de restauración UI: 1,4 MB de JSON; API: 1,5 MB, incluidos metadatos. Para conjuntos mayores usa respaldos/exportación nativa de D1 con su propia administración y Time Travel según el plan Cloudflare. Archiva y protege los JSON: contienen datos personales. El esquema se instala en una D1 nueva; no ejecutes la versión destructiva `DROP TABLE` original sobre datos existentes.

## API

Todas las rutas requieren `X-Team-Token`. Solo `/api/powerbi` también acepta `?token=`. Si falta `TEAM_TOKEN` de al menos 24 caracteres, la API responde 503, nunca un token predeterminado.

| Ruta | Método | Función |
| --- | --- | --- |
| `/api/sync` | GET | Agenda, notas, tareas, reuniones, formatos e integrantes |
| `/api/sync` | POST | Acción CRUD, `payload` y `operator_name` |
| `/api/presence` | POST | `pc_id`, `device_id`, `space_id`, `operator_name`; `leave` para salir |
| `/api/presence` | GET | Presencia activa filtrada con `space_id` |
| `/api/backup` | GET | Copia completa versionada |
| `/api/backup` | POST | `backup`, `operator_name` y `confirm` igual a `RESTAURAR` |
| `/api/powerbi` | GET | Cinco conjuntos de datos normalizados |
| `/api/notices` | GET | Bandejas y contador para el parámetro `operator` |

Acciones: `UPSERT_SPACE`, `DELETE_SPACE`, `ADD_NOTE`, `UPSERT_TASK`, `DELETE_TASK`, `ADD_MEETING`, `DELETE_MEETING`, `UPSERT_TEMPLATE`, `DELETE_TEMPLATE`, `UPDATE_MEMBERS`, `SEND_NOTICE`, `READ_NOTICE`, `ACK_NOTICE`, `CREATE_AGREEMENT_TASKS`. Las notas son cronológicas e inmutables desde la UI. Las consultas usan parámetros vinculados; no se interpolan campos del usuario en SQL.

## Verificación y empaquetado

```bash
npm test
npm run build
npm run test:integration
npm run test:browser
npm run test:workspace
npm audit
npm run package
```

Las pruebas de integración y navegador crean bases locales aisladas. Nunca apuntan al D1 remoto. Para las pruebas de navegador instala Chromium o ejecuta `npx playwright install chromium`; puedes definir `CHROMIUM_PATH` con la ruta del ejecutable. Las capturas se guardan en `artifacts/`. Las pruebas verifican el manifiesto, el service worker en un runtime simulado y el lector pasivo en un DOM de navegador simulado. La política administrativa de Chromium en este entorno impide cargar extensiones descomprimidas. La carga real de Manifest V3, WhatsApp real, el ancho del Side Panel y la aislamiento del iframe y persistencia del almacenamiento HTTPS quedan para verificación manual en tu Chrome.

`npm run package` usa Python `zipfile`, incluye fuente, lockfile, documentación, web compilada y extensión compilada; excluye Git, secretos, bases de desarrollo, caches y dependencias. Produce `artifacts/crm-whatsapp-ana-completo.zip`. Descomprime y sube el contenido de la carpeta raíz a GitHub. No subas `.dev.vars` ni `wrangler.local.toml`.

## Identidad visual

Se utiliza el logo original de ANA entregado por el usuario, conservado sin modificaciones en `src/assets/ana-logo.png`. El componente `AnaLogo` lo muestra en la barra lateral, el acceso y la cabecera de móvil/panel lateral. Vite incluye la imagen en la web y el empaquetador copia el PNG original para la pantalla de conexión de la extensión. La paleta usa el azul `#2957A4`, obtenido del propio archivo, con superficies blancas y azul oscuro para navegación. Los estados y las alertas conservan sus colores semánticos.

## Estructura

- `src/components/AnaLogo.jsx`: emblema original compartido por todas las vistas.
- `src/App.jsx`: estado, sincronización, operador, búsqueda, bandejas y directorio; Tareas agrupa Lista/Kanban.
- `src/components/SpaceDetail.jsx`: las cuatro pestañas de cada contacto y la colisión.
- `src/components/SpaceForm.jsx`: alta y edición del espacio y sus responsables.
- `src/components/DataCenter.jsx`: Excel, Power BI y entrega de cargo.
- `src/utils/excelExport.js`: libro real de cinco hojas.
- `shared/domain.js`: filtros, coincidencias seguras, firmas, minutas y tablas de reporte.
- `server/api.js`, `server/validation.js`: autenticación, validación, SQL y restauración atómica.
- `functions/api/[[path]].js`: entrada Pages Functions.
- `migrations/`: esquema e índices no destructivos. La API crea las tablas adicionales 1.1.0 en una transacción idempotente al primer acceso autenticado; no requiere ejecutar SQL manual en una base anterior. No se alteran ni borran las tablas originales.
- `extension/`: manifiesto, service worker, lector pasivo y contenedor local. Los scripts privilegiados se empaquetan localmente; la aplicación HTTPS se muestra en un iframe con sandbox, sin acceso a las APIs de extensión.
- `docs/CODIGO_REACT.md`: código íntegro de los componentes principales, para lectura.

## Límites operativos

La validación local no sustituye la revisión en tu cuenta de Cloudflare y tu sesión real de WhatsApp. El repositorio se publica en GitHub y el usuario administra el despliegue Pages. Las pruebas de esta entrega se ejecutan localmente; no se confunden con validación de la cuenta de producción. El token compartido, datos institucionales y política de tratamiento de información deben administrarse con las reglas de tu organización. Los latidos y consultas periódicas consumen operaciones D1: revisa cuotas y métricas de tu plan. El diseño descarga la agenda completa, por lo que está orientado a un equipo de coordinación; grandes volúmenes requieren paginación y búsqueda del lado del servidor.
