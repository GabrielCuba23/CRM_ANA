# Proyecto Power BI · CRM ANA

Proyecto Power BI Desktop (.pbip), no archivo binario .pbix. Incluye cinco páginas, modelo TMDL, medidas DAX, relaciones y consultas Power Query para las cinco tablas del CRM. Se verifica la estructura localmente; su apertura y ejecución deben validarse en Power BI Desktop actual de Windows. Power BI Desktop no está disponible de forma nativa en macOS.

## Abrir y conectar

1. Extrae todo el ZIP en una carpeta de Windows fuera del repositorio Git. Mantén juntas las carpetas Report y SemanticModel.
2. Abre CRM_ANA.pbip con Power BI Desktop actualizado. Si tu versión lo requiere, habilita proyectos Power BI (.pbip) en Opciones > Características de versión preliminar.
3. En Transformar datos > Administrar parámetros selecciona pOrigen = API, verifica pBaseUrl y escribe el token real en pTeamToken.
4. Si Power BI solicita credenciales para la URL, usa acceso Anónimo: el token viaja en la cabecera X-Team-Token. Configura la privacidad de los orígenes según las reglas de tu organización.
5. Pulsa Cerrar y aplicar y después Actualizar. El modelo usa Importación: se actualiza al refrescar; no recibe una transmisión en tiempo real.
6. Puedes guardar el proyecto como .pbix desde Power BI Desktop.

## Usar Excel

Descarga un reporte .xlsx de esta versión del CRM, cambia pOrigen a Excel y pArchivoExcel a la ruta real del archivo. El modelo importa las cinco tablas estructuradas por nombre, sin mezclar las tablas dinámicas del resumen. Reemplaza el archivo y refresca para actualizar.

## Seguridad y compatibilidad

El proyecto no incluye tokens ni datos de contactos. Los parámetros vacíos son requisitos de conexión. Power BI guarda parámetros como texto: no subas a GitHub una copia con tu token. No uses Publicar en la web con datos institucionales. La actualización programada en Power BI Service depende de las credenciales, privacidad, licencia y gateway aplicables.

La estructura PBIP/PBIR-Legacy y el tema base siguen el ejemplo oficial de Microsoft Analysis-Services: https://github.com/microsoft/Analysis-Services/tree/master/pbidevmode/fabricps-pbip/SamplePBIP . Se conserva su licencia MIT en MICROSOFT-LICENSE.txt. El modelo, las consultas, medidas y páginas de ANA se generaron para este proyecto.
