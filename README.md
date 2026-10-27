# CRM & Agenda Cloud de Coordinación Institucional · ANA / MIDAGRI

Aplicación React + Tailwind para navegador y Chrome Side Panel, Pages Functions y D1. El mismo repositorio construye la web en `dist/` y una extensión Manifest V3 autocontenida en `extension-dist/`. No requiere el celular maestro para gestionar contactos. No es un producto oficial de ANA ni de Meta.

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

Si agregas un dominio personalizado, el navegador usa automáticamente ese mismo origen para `/api`. La extensión permite autorizar expresamente ese dominio HTTPS al iniciar sesión, sin conceder acceso permanente a todos los sitios. `ALLOWED_ORIGINS` es opcional y acepta orígenes adicionales separados por comas; la web del mismo origen y los orígenes Chrome Extension ya se admiten. No se usa CORS `*`.

## Instalar el modo oficina

1. Compila con `npm run build` o usa `extension-dist/` del ZIP entregado.
2. En Chrome abre el administrador de extensiones, activa modo desarrollador y usa **Cargar descomprimida**, seleccionando `extension-dist/`.
3. Fija la extensión, abre WhatsApp Web y pulsa el icono CRM ANA para abrir el Side Panel.
4. Introduce la URL de tu Pages (solo el origen HTTPS, sin `/api`) y el token de equipo. Autoriza el acceso únicamente a ese origen cuando Chrome lo solicite.
5. Elige «¿Quién opera esta PC?». Ajusta manualmente el ancho del panel entre 380 y 450 px; Chrome administra el ancho y no permite fijarlo desde el manifiesto.

El lector solo observa `#main header` y transmite el texto del título. No agrega botones, no cambia atributos, no escribe chats, no lee la lista de mensajes ni envía mensajes. La API de WhatsApp no forma parte del proyecto. La detección depende del DOM disponible: si Meta cambia el encabezado, puede dejar de detectar; el directorio manual sigue disponible.

Los teléfonos se normalizan quitando espacios y signos, sin inventar prefijos internacionales. Usa código de país. Un encabezado con nombre guardado no revela necesariamente el número real; los grupos no exponen un ID estable en su título. La coincidencia por nombre solo se abre automáticamente si es única. Ante duplicados o falta de coincidencia se pide seleccionar un espacio o crear uno con el teléfono/ID conocido. Nunca se asignan espacios por similitud aproximada.

`Abrir borrador en WhatsApp` abre un enlace oficial con texto preparado. Para grupos el destinatario se elige manualmente. No confirma ni automatiza el envío. La bitácora registra «borrador abierto» o «texto copiado», sin afirmar que el mensaje se entregó.

## Operación del equipo

- El token compartido autentica al **equipo**. El selector identifica al operador por declaración y no es una identidad criptográficamente verificada. Cualquier poseedor del token tiene acceso total, incluida restauración. Este modelo cumple acceso maestro compartido, pero no reemplaza permisos individuales, MFA ni auditoría inalterable.
- El token vive en `sessionStorage` del navegador/panel, no se incluye en respaldos ni en el ZIP. El operador, ID de dispositivo, firma y origen API se conservan en `localStorage`. Cerrar sesión borra el token; cerrar la sesión del navegador puede requerir volver a ingresarlo. Cambiar `TEAM_TOKEN` en Pages y volver a desplegar revoca el acceso del token anterior.
- Cada pestaña/panel tiene un identificador de sesión y cada perfil de navegador un identificador de dispositivo. Dos perfiles en la misma máquina pueden aparecer como dos PC. Los latidos son cada 4 segundos y expiran a los 15 segundos. No son bloqueos de edición. Se informa cuando no se puede actualizar la presencia.
- El estado de la agenda se refresca cada 12 segundos y después de cada escritura. La detección de colisión usa un endpoint independiente que devuelve solo presencia, sin descargar toda la base cada cuatro segundos.
- Los espacios verifican su fecha de actualización para evitar sobrescribir una edición concurrente. Una nota también actualiza el espacio. Ante conflicto actualiza y vuelve a abrir el formulario. Tareas, reuniones y formatos usan última escritura; la cinta de presencia avisa del trabajo paralelo.
- Cada nota lleva autor del operador, tareas y reuniones llevan autor y último operador, y los formatos firmados se registran como nota al copiar/abrir borrador. Las marcas de tiempo se generan en el servidor; reuniones y presentación usan hora de Perú.
- Para eliminar un integrante, reasigna sus espacios y tareas pendientes primero. La autoría histórica permanece. Conserva al menos un integrante.
- Contactos y su información relacionada se guardan en D1, independientemente de la libreta del teléfono que escaneó WhatsApp.

Los comandos `/drive`, `/tdr` y `/cut` se instalan como formatos iniciales editables. `/drive` abre el servicio general de Google Drive; sustituye su contenido por el enlace real de la carpeta del equipo cuando la tengas.

## Centro de datos

El Excel usa SheetJS 0.20.3 y genera exactamente `1_Resumen_KPIs`, `2_Agenda_Espacios`, `3_Tareas_y_CUTs`, `4_Bitacora_Historica` y `5_Reuniones_Acuerdos`. No ejecuta fórmulas con texto de notas: los textos se escriben como celdas de texto. Se carga de forma diferida para reducir el JavaScript inicial.

La dependencia `xlsx` es un alias al espejo npm `@e965/xlsx@0.20.3`, que distribuye SheetJS CE bajo Apache-2.0. Se usa un espejo comunitario porque el CDN oficial no está permitido en la red de este entorno. La versión y la integridad están fijadas en `package-lock.json`; no se usa el paquete npm `xlsx@0.18.5`, con vulnerabilidades conocidas. Revisa esta decisión de cadena de suministro según la política de tu organización. `THIRD_PARTY_NOTICES.md` contiene la atribución.

El conector Power BI muestra/copia la URL real de la instancia con el token codificado. La respuesta incluye `Resumen_KPIs`, `Agenda_Espacios`, `Tareas_y_CUTs`, `Bitacora_Historica` y `Reuniones_Acuerdos`. Al conectar elige cada lista y conviértela en tabla en Power Query. La URL es una credencial: puede quedar en el historial, el archivo PBIX y registros del proveedor. El endpoint no acepta token por URL para ningún otro recurso. Usa cabecera `X-Team-Token` en integraciones que la permitan.

La copia JSON incluye las cinco tablas y los integrantes, un identificador de aplicación y versión de esquema. La restauración comprueba campos, enlaces, referencias, duplicados y tamaños **antes** de modificar datos, y ejecuta borrado e inserción en un único `DB.batch` atómico. Se descarga una copia de seguridad del estado anterior antes de restaurar desde la UI. Se excluye presencia porque es temporal. La copia no incluye cuenta Cloudflare, token, dominio, ni UUID: el nuevo administrador configura su propio Pages/D1 y restaura el JSON.

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

Acciones: `UPSERT_SPACE`, `DELETE_SPACE`, `ADD_NOTE`, `UPSERT_TASK`, `DELETE_TASK`, `ADD_MEETING`, `DELETE_MEETING`, `UPSERT_TEMPLATE`, `DELETE_TEMPLATE`, `UPDATE_MEMBERS`. Las notas son cronológicas e inmutables desde la UI. Las consultas usan parámetros vinculados; no se interpolan campos del usuario en SQL.

## Verificación y empaquetado

```bash
npm test
npm run build
npm run test:integration
npm run test:browser
npm audit
npm run package
```

Las pruebas de integración y navegador crean bases locales aisladas. Nunca apuntan al D1 remoto. Para las pruebas de navegador instala Chromium o ejecuta `npx playwright install chromium`; puedes definir `CHROMIUM_PATH` con la ruta del ejecutable. Las capturas se guardan en `artifacts/`. Las pruebas verifican el manifiesto, el service worker en un runtime simulado y el lector pasivo en un DOM de navegador simulado. La política administrativa de Chromium en este entorno impide cargar extensiones descomprimidas. La carga real de Manifest V3, WhatsApp real, el ancho del Side Panel y la autorización interactiva del dominio quedan para verificación manual en tu Chrome.

`npm run package` usa Python `zipfile`, incluye fuente, lockfile, documentación, web compilada y extensión compilada; excluye Git, secretos, bases de desarrollo, caches y dependencias. Produce `artifacts/crm-whatsapp-ana-completo.zip`. Descomprime y sube el contenido de la carpeta raíz a GitHub. No subas `.dev.vars` ni `wrangler.local.toml`.

## Estructura

- `src/App.jsx`: estado, sincronización, operador, búsqueda, bandejas, directorio y Kanban.
- `src/components/SpaceDetail.jsx`: las cuatro pestañas de cada contacto y la colisión.
- `src/components/SpaceForm.jsx`: alta y edición del espacio y sus responsables.
- `src/components/DataCenter.jsx`: Excel, Power BI y entrega de cargo.
- `src/utils/excelExport.js`: libro real de cinco hojas.
- `shared/domain.js`: filtros, coincidencias seguras, firmas, minutas y tablas de reporte.
- `server/api.js`, `server/validation.js`: autenticación, validación, SQL y restauración atómica.
- `functions/api/[[path]].js`: entrada Pages Functions.
- `migrations/0001_initial.sql`: esquema e índices no destructivos.
- `extension/`: manifiesto, service worker y lector pasivo; se empaquetan sin código remoto.
- `docs/CODIGO_REACT.md`: código íntegro de los componentes principales, para lectura.

## Límites operativos

La validación local no sustituye la revisión en tu cuenta de Cloudflare y tu sesión real de WhatsApp. No se ha desplegado remotamente desde este entorno ni se ha publicado en GitHub. El token compartido, datos institucionales y política de tratamiento de información deben administrarse con las reglas de tu organización. Los latidos y consultas periódicas consumen operaciones D1: revisa cuotas y métricas de tu plan. El diseño descarga la agenda completa, por lo que está orientado a un equipo de coordinación; grandes volúmenes requieren paginación y búsqueda del lado del servidor.
