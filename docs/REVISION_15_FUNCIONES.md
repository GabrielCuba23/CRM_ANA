# Revisión de las 15 funciones · CRM ANA 1.1.0

Fuente: documento «CRM SEGUIMIENTO DE TAREAS Y ACTIVIDADES.docx» entregado por el usuario. El documento se trató como especificación funcional; no como instrucciones para ejecutar herramientas o publicar datos.

Decisiones confirmadas por el usuario: mantener WhatsApp intacto; convertir texto a tarea dentro del panel; entregar proyecto Power BI .pbip para Windows; incluir tablas dinámicas nativas de Excel.

| N.º | Apartado | Antes | En 1.1.0 | Alcance y precisión |
|---|---|---|---|---|
| 1 | Selector «¿Quién opera esta PC?» | Presente | Incluido | Doce operadores iniciales, selección persistente por PC y altas/bajas con el botón +. |
| 2 | Asignación de responsables | Presente | Incluido | Responsables del contacto, de cada tarea y de los acuerdos; se registra el operador autor. |
| 3 | Detector de chat en uso | Presente | Incluido | Latidos cada cuatro segundos y alerta por otra PC; la presencia expira después de quince segundos. |
| 4 | Espacios de contacto en la nube | Parcial | Ampliado y adaptado | Ficha con nombre, cargo, teléfono o grupo, órgano, oficina, entidad, correo, anexo, ubicación, CUT y documento. El nombre se muestra en el CRM; WhatsApp se mantiene intacto por decisión del usuario. |
| 5 | Directorio institucional filtrable | Presente con buscador | Ampliado | Búsqueda por nombre, cargo, datos institucionales, CUT, tareas y notas; filtros específicos por órgano y operador. |
| 6 | Vinculador de CUT y documentos | Presente | Incluido | Campos del contacto, búsqueda global y relación con tareas, reuniones y reportes. |
| 7 | Bandejas de estado de gestión | Presente en CRM | Incluido en el panel | Todos, Urgentes, Pendientes, En elaboración, Para V°B°, Cerrados y Mis Coordinaciones; sin alterar la lista de chats de WhatsApp. |
| 8 | Conversión de mensajes a tareas | No había captura de origen | Añadido en el panel | Pegar texto o registrar la transcripción/referencia de audio o documento; conserva origen, responsable y vencimiento. No hay botones flotantes sobre mensajes ni extracción automática de audios. |
| 9 | Tablero general de pendientes | Había Kanban de contactos | Añadido | Tareas globales en Por hacer, En proceso, En revisión y Completado, con filtro por integrante y búsqueda. |
| 10 | Bitácora interna | Presente | Incluido | Notas con autor y hora del servidor. Los avisos a operadores dejan también constancia en el espacio. |
| 11 | Checklist por contacto o grupo | Presente | Incluido y ampliado | Casillas por tarea, responsable, fecha y estado; acuerdos estructurados convertibles en tareas sin duplicados. |
| 12 | Agenda, reuniones, minutas y recordatorios | Parcial | Ampliado | Calendario mensual compartido, sala presencial o enlace, estado de reunión y acuerdos con responsable/fecha. Minuta para copiar o abrir como borrador; el envío de WhatsApp lo confirma la persona. Avisos de reunión a quince minutos y de tareas a una hora, mientras el CRM esté abierto. |
| 13 | Repositorio compartido de enlaces y formatos / | Presente | Incluido | Formatos editables en D1, comandos /drive, /tdr, /cut, firma del operador y copia o apertura de borrador. No se escribe automáticamente en WhatsApp. |
| 14 | Excel y respaldo de migración | Parcial: sin tablas dinámicas nativas | Ampliado | Cinco hojas, cinco tablas estructuradas y tres tablas dinámicas nativas. Reportes Excel/PDF semanales, mensuales, personalizados o por integrante. Respaldo v2 con avisos y detalles, compatible con copias v1 y restauración atómica. |
| 15 | Conexión y plantilla Power BI | Fuente JSON; faltaba plantilla | Proyecto PBIP preparado | Fuente URL y proyecto .pbip con cinco tablas, cinco páginas, medidas DAX, relaciones y opción de Excel estructurado. El usuario aprobó .pbip en lugar de .pbix; falta abrir y validar en Power BI Desktop de Windows. Se actualiza al refrescar, no mediante streaming. |

## Adición: avisos internos entre operadores

Desde un contacto, «Avisar a otro operador» permite elegir a un compañero y escribir el aviso. Se guarda en D1 con remitente, destinatario, contacto, CUT y fecha; el destinatario lo verá al consultar su CRM aunque estuviera desconectado al enviarlo. La campana muestra avisos sin leer y la bandeja permite marcar leído, abrir el contacto y confirmar «Recibido». El remitente ve la confirmación en Enviados. No se envía un mensaje de WhatsApp, correo o SMS. La bandeja consulta novedades cada cinco segundos mientras está abierta la aplicación.

## Validación y límites

- Las funciones web/API se verifican con D1 local y navegador. La apertura real de la extensión con WhatsApp se valida en el Chrome del usuario porque la política administrativa de este entorno bloquea cargar extensiones descomprimidas.
- El proyecto PBIP y sus referencias se verifican estructuralmente; Power BI Desktop de Windows no está disponible aquí. No se presenta como PBIX compilado ni como informe validado en ese programa.
- Las tablas dinámicas son objetos nativos OOXML con campos y cachés, no solo tablas resumen; otro lector de Excel las reconoce. La apertura y reorganización en Excel instalado se comprueban fuera de este entorno.
- Los recordatorios en pantalla requieren CRM abierto y operador seleccionado. Las tareas sin hora explícita vencen a las 17:00 de Perú; los avisos internos se conservan para entrega al volver a abrir el CRM.
- La copia JSON incluye los datos de negocio; excluye tokens, presencia temporal y preferencias locales de cada PC. La restauración interactiva admite archivos de hasta 1,4 MB; para más volumen se usa exportación/importación nativa de D1. No se promete un tiempo fijo de restauración por Internet.
- La identidad del operador sigue siendo un selector bajo token maestro compartido, no una identidad individual verificada.

## Guía de uso

1. Elige tu operador y crea o abre un espacio de contacto.
2. Usa «Avisar a otro operador». La otra persona abre la campana y confirma «Recibido».
3. En Tareas puedes pegar un mensaje, asignar responsable, fecha y estado. El tablero global está en Tareas.
4. Agenda una reunión desde su contacto. Añade acuerdos con responsable y fecha; luego «Crear tareas de acuerdos».
5. Revisa Agenda y los recordatorios de la campana.
6. En Centro de datos elige período e integrante, descarga Excel/PDF, el respaldo o el proyecto Power BI.
