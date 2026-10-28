# CRM web 1.3.0 y lector Chrome 1.2.1

## Tareas y Kanban unificados

El menú tiene una sola sección **Tareas**. Sus botones **Lista** y **Tablero Kanban** muestran los mismos registros con los mismos filtros por responsable, estado y búsqueda. Cambiar el estado en una vista se refleja en la otra y en el checklist del contacto. La vista elegida se recuerda en ese navegador. Las bandejas Urgente, Pendiente, En elaboración, Para V°B° y Cerrado de los contactos permanecen en Directorio.

## Crear y exportar eventos

En **Agenda → Nuevo evento** registra título, inicio y fin en hora de Perú, participantes, descripción, sala o enlace. Puedes dejar **Evento general del equipo** o vincular un contacto y su CUT. Se puede editar, cancelar o eliminar desde la Agenda; los eventos vinculados también se muestran en Reuniones del contacto. Las reuniones anteriores siguen disponibles y conservan sus acuerdos.

Cada evento o reunión ofrece **Google Calendar** y **Apple / Outlook (.ics)**. Google abre un borrador con horario, participantes escritos como descripción, ubicación y enlace; confirma Guardar en tu cuenta. No se envían invitaciones a terceros. Los textos muy largos pueden abreviarse para respetar el tamaño del enlace Google; la interfaz lo indica y el ICS conserva todo el texto.

El archivo ICS se descarga en un clic y se puede abrir/importar en Apple Calendar, Outlook, Google Calendar u otro programa compatible. **Exportar selección .ics** descarga los eventos del mes/día y búsqueda visibles. Es exportación, no sincronización bidireccional: las ediciones y eliminaciones posteriores del CRM deben reflejarse por separado en el calendario personal. La aplicación no dispone de acceso a tu cuenta Google/Apple.

Los eventos nuevos conservan inicio y fin. Las reuniones anteriores sin fin explícito se exportan con una hora de duración. Las horas se escriben como instantes UTC y se presentan en el CRM en America/Lima, para que el calendario receptor pueda convertirlas a su zona. ICS incluye UID estable, revisión, estado y texto escapado/pliegue UTF-8. No contiene TEAM_TOKEN ni conexiones privadas de la API. Una importación repetida puede requerir gestionar duplicados según el programa utilizado.

## Eliminar notas

Cada registro de Bitácora tiene **Eliminar nota**. Se muestra una confirmación con el espacio y un fragmento antes de eliminarlo. Cancelar conserva el registro. La eliminación afecta ese registro para todo el equipo; las demás notas y las tareas/reuniones permanecen. Como el acceso es maestro compartido, cualquier operador activo autorizado puede realizar esta operación; el selector no crea permisos personales ni una bitácora inmutable.

## Órganos y unidades

**Sede Central** y **Prensa** están disponibles por defecto. En la ficha pulsa **Añadir órgano/unidad**, escribe el nombre y **Guardar unidad**. Queda seleccionado y se comparte con las demás PC al sincronizar. También aparece en el filtro del Directorio y en los reportes. Se admiten hasta 100 unidades y se detectan duplicados de nombre sin distinguir acentos/mayúsculas en la validación. Las unidades personalizadas se incluyen en el respaldo.

## Detección del chat

La web acepta mensajes privilegiados cuya fuente se omite por el navegador, manteniendo comprobación de origen Chrome, canal aleatorio, protocolo y origen fijado tras el primer contexto válido. Reintenta el anuncio inicial si no recibe respuesta. Al crear una ficha para el chat activo, vuelve a calcular la coincidencia para abrirla inmediatamente.

El lector 1.2.1 añade selectores alternativos del encabezado y una comprobación de solo lectura cada dos segundos. El contenedor solicita nuevamente el contexto mientras el panel está visible, conserva la asociación a su ventana y no depende únicamente de una notificación de cambio. No lee conversaciones ni cambia el DOM de WhatsApp.

El panel muestra siempre el contexto de chat y ofrece **Volver a detectar chat** y **Abrir ficha de este chat**. Las coincidencias por nombre solo abren una ficha si son únicas; ante duplicados se elige manualmente. Un título de WhatsApp no proporciona necesariamente el número ni un identificador estable de grupo.

La captura del usuario confirmó ausencia de contexto, pero no permite determinar por sí sola si el origen es un lector no reactivado, un cambio de encabezado o el puente. Las correcciones se verifican con navegador y runtimes simulados; la sesión real debe comprobarse en su Chrome.

## Actualizar sin perder información

1. Espera la implementación correcta de main en Pages. Pulsa Actualizar CRM o recarga el panel para recibir la web 1.3.0. No hay que cambiar TEAM_TOKEN.
2. Para activar también el lector reforzado, reemplaza el contenedor por `crm-ana-extension.zip`, versión Chrome **1.2.1**, y pulsa Recargar en `chrome://extensions`.
3. **Después recarga la pestaña de WhatsApp Web** con Ctrl+R o ⌘R. Recargar la extensión o el panel no vuelve a inyectar un content script en una pestaña que ya estaba abierta.
4. Abre un chat. Debe aparecer su nombre en el CRM; usa Abrir ficha o Crear espacio según corresponda. Las tareas, notas y reuniones siguen en D1.

Las funciones web seguirán distribuyéndose desde Cloudflare. Un cambio del lector local requiere extensión nueva; la distribución automática de esas versiones depende de publicarla en Chrome Web Store, aún pendiente de la cuenta y revisión de Google.

La tabla de eventos se crea automáticamente al primer acceso autenticado, de forma aditiva, o mediante la migración 0004. El respaldo nuevo es **v3** y conserva eventos y unidades. Se siguen restaurando copias v1 y v2; para restaurar una copia v3 usa esta versión de la web. Excel, PDF y la fuente Power BI incluyen los eventos en la quinta hoja/tabla, con tipo, descripción e inicio/fin. El proyecto PBIP incorpora las nuevas columnas; su apertura nativa en Windows sigue siendo una comprobación externa.
