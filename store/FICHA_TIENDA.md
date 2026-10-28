# Ficha preparada · Chrome Web Store

## Nombre

CRM & Agenda Cloud - Coordinación ANA (MIDAGRI)

## Descripción breve

Agenda institucional compartida y panel pasivo de WhatsApp Web.

## Descripción completa

Organiza la coordinación del equipo desde un panel lateral junto a WhatsApp Web o desde la aplicación web fuera de la oficina.

El CRM reúne espacios de contacto, CUT y documentos de referencia, responsables, bitácora, tareas, calendario, reuniones, acuerdos y formatos compartidos. Incluye avisos internos entre operadores, alerta cuando otra PC tiene abierto el mismo espacio, reportes Excel con tablas dinámicas nativas, PDF, conexión Power BI y copia JSON para entrega de cargo.

El lector de WhatsApp es pasivo: observa solo el título del chat abierto para mostrar el espacio correspondiente. No modifica WhatsApp, no lee conversaciones, no descarga adjuntos y no envía mensajes. Puedes pegar voluntariamente texto en el CRM para registrar una tarea.

La aplicación requiere conexión a Internet y el token del equipo administrador. Los datos se guardan en su cuenta Cloudflare D1. El selector de operador identifica quién está trabajando en la PC bajo un acceso maestro compartido.

Las funciones web se actualizan desde Cloudflare. La extensión contiene el lector pasivo, el contenedor del panel y un puente limitado; no recibe el token por ese puente ni ejecuta scripts remotos con permisos de Chrome.

No es una aplicación oficial de WhatsApp o Meta. El emblema y denominación ANA identifican el contexto de coordinación del equipo; esta publicación no implica respaldo oficial de la institución.

## Propósito único

Relacionar el chat abierto en WhatsApp Web con el espacio de coordinación institucional del equipo, mostrando su agenda compartida en el panel lateral.

## Justificación de permisos

| Permiso u origen | Uso |
|---|---|
| sidePanel | Mostrar el CRM junto a la pestaña de trabajo. |
| storage | Mantener temporalmente el título del chat por ventana en storage.session y conservar operador/firma en storage.local. |
| https://web.whatsapp.com/* | Leer únicamente el título del encabezado mediante el content script pasivo. |
| https://crm-whatsapp-ana.pages.dev/* | Alojar la aplicación web del equipo dentro del iframe y habilitar su almacenamiento de sitio en el panel. |

No se pide activeTab, tabs, historial, cookies, scripting ni acceso general a otros dominios. Los eventos de pestaña se utilizan solo para retirar o actualizar el contexto al cambiar de pestaña; no se recopila historial de navegación.

## Arquitectura para la revisión técnica

El service worker valida mensajes de WhatsApp activo y marco principal; solo mantiene títulos temporales. El contenedor local carga un iframe con sandbox al origen HTTPS exacto. El iframe no accede al contexto JavaScript ni a las APIs de la extensión. La conexión postMessage verifica origen, source, nonce y versión. No hay comandos web para invocar APIs Chrome, eval ni script remoto en un contexto privilegiado. La aplicación web y la extensión están disponibles íntegramente en https://github.com/GabrielCuba23/CRM_ANA.

El iframe remoto usa la excepción de contexto aislado de las APIs de extensión; decláralo transparentemente en la ficha de revisión de código remoto. La revisión de Google determina si la implementación y finalidad cumplen las políticas vigentes. No declarar que toda la aplicación web está empaquetada localmente.

## Datos y privacidad

Política: https://crm-whatsapp-ana.pages.dev/privacy.html

Declarar los datos que efectivamente trate el despliegue: nombres/teléfonos/correos institucionales y demás información de contacto, título del chat abierto, y registros que los operadores escriben voluntariamente (notas, tareas, minutas y avisos). No se recopila el historial de chats por el lector. El token lo procesa la web HTTPS para autenticar al equipo; no es una contraseña de WhatsApp ni se recopila por el content script.

Las categorías de la consola pueden cambiar: relaciona estas operaciones reales con las categorías vigentes y no marques ausencia de datos solo porque el título sea temporal. El código no incluye anuncios, venta de datos ni analítica comercial. La base es compartida por el equipo y utiliza Cloudflare como infraestructura.

## Material y envío

El ZIP `artifacts/crm-ana-extension.zip` contiene los iconos y el manifiesto en su raíz. Añade capturas de la extensión real con información de demostración en los tamaños que solicite la consola. Configura el correo de soporte verificado y el nombre del publicador en la cuenta Google real; no se inventan direcciones de contacto en el repositorio. Selecciona No listada y espera la revisión. Un token de revisión, si se requiere, debe dar acceso a datos de prueba aislados y comunicarse únicamente por los campos privados de Google.

El icono incorpora el logo entregado por el usuario; el publicador debe contar con autorización para su uso. No se ha enviado ni publicado este elemento desde el entorno de desarrollo.
