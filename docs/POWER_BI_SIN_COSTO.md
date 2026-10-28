# Conectar el CRM a Power BI sin contratar licencias

La opción prevista es Power BI Desktop en una PC con Windows ya disponible. El uso local de Desktop para abrir, actualizar y guardar el informe no requiere licencia Pro. No es necesario pagar una inscripción de desarrollador de Chrome para usar el conector.

Power BI Desktop no tiene versión nativa para macOS y el proyecto PBIP no se abre en Excel ni directamente como informe en un navegador. Si solo hay Mac, hace falta usar una PC Windows existente del equipo para este flujo. No se proponen máquinas virtuales, suscripciones o pruebas de pago bajo la restricción de cero gastos adicionales.

## Preparar el programa

1. Descarga Power BI Desktop desde la página oficial de Microsoft: https://www.microsoft.com/es-es/power-platform/products/power-bi/desktop . Instálalo en Windows. El acceso a Desktop local no implica contratar Power BI Pro, Premium ni Fabric.
2. Descarga el proyecto: https://github.com/GabrielCuba23/CRM_ANA/raw/refs/heads/main/public/powerbi/CRM_ANA_PowerBI.pbip.zip .
3. Extrae el ZIP completo en una carpeta local fuera del repositorio Git. No abras archivos directamente dentro del ZIP. Conserva juntas CRM_ANA.pbip, CRM_ANA.Report y CRM_ANA.SemanticModel.
4. Abre CRM_ANA.pbip en Power BI Desktop actualizado. Si esa versión lo pide, habilita proyectos Power BI (.pbip) en Archivo → Opciones y configuración → Opciones → Características de versión preliminar, reinicia Desktop y vuelve a abrir el proyecto.

## Configurar el acceso privado

En Inicio → Transformar datos → Administrar parámetros configura:

| Parámetro | Valor |
|---|---|
| pOrigen | API |
| pBaseUrl | https://crm-whatsapp-ana.pages.dev |
| pTeamToken | El mismo token privado que usas para entrar al CRM, escrito únicamente dentro de Power BI. |
| pArchivoExcel | Se deja vacío cuando pOrigen es API. |

El proyecto se entrega sin token y sin registros privados. Si al abrir aparece que falta pTeamToken, configura ese parámetro antes de actualizar. No escribas el token en una captura compartida, una conversación o un archivo de GitHub.

Cuando Power BI pida credenciales del origen web, selecciona **Anónimo**. La consulta ya envía el token en la cabecera X-Team-Token; no es una cuenta Microsoft ni una contraseña de WhatsApp. No lo pongas en el campo de usuario/contraseña de autenticación básica. Define la privacidad del origen conforme a las reglas del equipo; se trata de datos internos, no una fuente pública.

Pulsa **Cerrar y aplicar** y después **Actualizar**. Las cinco tablas esperadas son Resumen_KPIs, Agenda_Espacios, Tareas_y_CUTs, Bitacora_Historica y Reuniones_Acuerdos. Esta última incluye reuniones y eventos generales/vinculados. El informe tiene cinco páginas con medidas y relaciones preparadas.

## Verificar y guardar

Compara con el CRM el total de contactos y tareas, un CUT conocido y una reunión/evento. Si la base tiene pocas filas o está vacía, algunos gráficos mostrarán pocos datos; no introduzcas datos institucionales ficticios para llenar el informe.

Guarda el informe localmente. Puedes mantener el proyecto PBIP y, si tu versión lo permite, usar Archivo → Guardar como para obtener PBIX. Una copia con pTeamToken configurado debe conservarse fuera del repositorio y tratarse como privada. El proyecto conserva la configuración del parámetro como texto.

Pulsa Actualizar para traer cambios posteriores del CRM. Es un modelo de Importación; no es streaming ni actualización continua. La información no se envía al servicio público por abrir el proyecto local.

## Alternativa con Excel

Si no quieres conectar directamente la API, descarga el .xlsx desde Centro de datos del CRM. En los parámetros cambia pOrigen a Excel y pArchivoExcel a la ruta local real del archivo. Se importan las cinco tablas estructuradas por nombre. Para renovar la información reemplaza ese archivo con una exportación nueva y pulsa Actualizar.

Compartir informes por Power BI Service, automatizar actualizaciones en la nube o funciones de colaboración puede requerir otras licencias y configuración. Esos servicios no se contratan en este flujo. No se utiliza Publicar en la web para datos internos.

## Si aparece un error

- Token inválido / HTTP 401: verifica el parámetro privado contra el acceso actual al CRM.
- Credenciales web incompatibles: revisa en Configuración de origen de datos que el método sea Anónimo para este dominio y vuelve a conectar.
- Formato PBIP/TMDL no admitido: verifica la versión actual de Power BI Desktop y conserva el mensaje exacto para diagnosticarlo.
- Aplicación web/HTML en lugar de datos: comprueba la URL base y el despliegue de Pages Functions. El endpoint debe devolver JSON autenticado.

El proyecto y la API se han comprobado estructuralmente y con D1/navegador locales. La apertura y ejecución real de PBIP debe verificarse en Power BI Desktop de Windows; no se afirma una validación nativa desde este entorno Linux.
