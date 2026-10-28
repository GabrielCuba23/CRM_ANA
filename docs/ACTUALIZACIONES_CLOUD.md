# Actualizar el CRM sin repartir ZIPs · 1.2.0

El panel abre `https://crm-whatsapp-ana.pages.dev/panel` en un iframe aislado. El contenedor y el lector pasivo son locales; React, estilos, reportes y API se despliegan en Cloudflare. Los datos siguen en la misma D1. Este cambio no necesita migraciones SQL adicionales ni cambiar TEAM_TOKEN.

## Instalación inicial en cada PC

1. Espera que Pages despliegue correctamente la versión nueva de main. Comprueba que `/version.json` devuelva JSON y que `/panel` muestre el acceso al abrirlo en una pestaña.
2. Descarga `artifacts/crm-ana-extension.zip`. Cierra el panel y reemplaza los archivos de la carpeta de la extensión anterior, conservando la misma carpeta para mantener su identidad descomprimida. Si Chrome tiene una tarjeta antigua duplicada, desactívala.
3. En `chrome://extensions` pulsa Recargar. Debe mostrar versión 1.2.0. Recarga WhatsApp Web para activar el lector del nuevo contexto.
4. Abre el panel. El origen ya está configurado; introduce únicamente el token del equipo. La sesión anterior no se copia desde la extensión al sitio HTTPS. El acceso al panel no coloca el token en su URL ni en mensajes del puente. La URL privada opcional del conector Power BI conserva el comportamiento anterior y debe tratarse como confidencial.
5. Se intenta conservar una vez el operador y preferencia de firma de la instalación anterior, sin pisar las preferencias ya elegidas en Cloudflare. Verifica tu operador. Si cambiaste de carpeta/perfil o usas una instalación de tienda nueva, puedes tener que seleccionarlo de nuevo.
6. Prueba dos contactos, una nota y un aviso interno. Los registros previos siguen en D1. Ajusta el ancho del panel a 380–450 px.

## Actualizaciones habituales

Publica los cambios en main. Pages compila y despliega. Los paneles nuevos o recargados cargan el despliegue actual. Un panel abierto consulta `version.json` cada minuto mientras está visible y al volver a estar visible; si cambia el identificador del build, aparece Actualizar CRM. Guarda primero los formularios y confirma la recarga. No se fuerza una recarga durante la edición. El botón de actualización comprueba que no haya una escritura del CRM en curso.

No hay service worker web ni una copia local React que deba reemplazarse. El HTML y el descriptor de versión usan no-store; los assets compilados tienen nombre con hash. Una interrupción de Internet impide abrir funciones que requieren la nube; el contenedor ofrece reintento y apertura en pestaña. No se promete trabajo sin conexión.

El botón Recargar de la barra superior del contenedor también pide confirmación. Evita usarlo mientras guardas una operación. Los avisos internos y el resto de datos se sincronizan según sus intervalos normales, independientemente de las versiones de código.

## Cambios que sí requieren extensión nueva

Cambiar el selector del encabezado de WhatsApp, el service worker, el puente local, permisos o el dominio autorizado exige subir la versión de manifest.json y distribuir el nuevo paquete. El protocolo del puente tiene versión 1: futuras actualizaciones web deben mantenerlo compatible con los contenedores instalados. No se deben añadir comandos remotos para ejecutar código, usar APIs Chrome, leer mensajes o inyectar elementos en WhatsApp.

## Publicación No listada en Chrome Web Store

1. Accede al panel de desarrolladores de Chrome Web Store con tu cuenta de Google. Completa el registro de desarrollador, verificación y pago que Google solicite. El acceso a GitHub o Cloudflare no sustituye esa cuenta.
2. Crea un elemento y sube `crm-ana-extension.zip` directamente, sin una carpeta exterior. Incluye manifest.json en la raíz, iconos PNG y scripts locales. No subas el ZIP del proyecto completo ni tokens.
3. Usa el texto y las justificaciones de `store/FICHA_TIENDA.md`. Revisa que el nombre del publicador, los datos de contacto de soporte y las declaraciones correspondan al administrador real. Añade capturas del panel funcionando con datos de demostración. No se incluyen contactos o conversaciones reales como material promocional.
4. Indica como política de privacidad `https://crm-whatsapp-ana.pages.dev/privacy.html`. Comprueba primero que la página esté publicada y que refleje el uso real del equipo.
5. Explica en la revisión que el iframe HTTPS es la aplicación web separada, que su código está disponible en el repositorio y que el puente solo transmite el título del chat y dos preferencias. Los scripts privilegiados son locales; no hay eval, inyección remota ni descarga de scripts privilegiados. La revisión y aceptación de este uso corresponden a Google; el paquete no garantiza aprobación.
6. Si Google solicita acceso autenticado para revisar todas las funciones, prepara con el administrador un acceso de prueba aislado de la D1 institucional. No entregues el token maestro real ni lo incluyas en el paquete. Este acceso de revisión aún no está aprovisionado.
7. Elige visibilidad **No listada** en Distribución y envía a revisión. No listada significa que cualquiera con el enlace puede instalar; el token sigue siendo obligatorio para entrar al CRM.
8. Cuando Google apruebe y publiques, instala desde ese enlace en cada PC y desactiva la copia descomprimida. La instalación de tienda tendrá un identificador distinto del de una copia local; vuelve a seleccionar operador e iniciar sesión si hace falta.
9. Para futuras versiones del contenedor, aumenta la versión y actualiza el mismo elemento de la tienda. Chrome las distribuye automáticamente según sus plazos y revisión. No es una actualización instantánea ni actualiza las copias descomprimidas.

La entrega deja preparado el paquete y la documentación. No crea una cuenta Google, no paga tasas, no envía la ficha ni afirma que la extensión ya esté publicada.

## Aislamiento y diagnóstico

- La extensión solo autoriza web.whatsapp.com y crm-whatsapp-ana.pages.dev. No pide activeTab ni permisos generales sobre todos los sitios. El origen HTTPS se fija en el paquete y no lo puede cambiar la página web por mensaje.
- La web no ejecuta APIs de extensión. READY solo anuncia un protocolo y nonce; CONTEXT envía exclusivamente título, ID de pestaña y preferencias permitidas. PREFERENCES devuelve únicamente operador y firma para conservar la selección en la extensión. Se verifican origen, ventana, protocolo, nonce, tipo y longitudes. No hay puente de token, base de datos, peticiones arbitrarias ni ejecución de comandos.
- Los títulos se almacenan en chrome.storage.session por ventana y se limpian al cambiar/cerrar la pestaña; los valores persistentes anteriores se retiran al instalar. El lector sigue siendo de solo lectura.
- `/` conserva frame-ancestors none y X-Frame-Options DENY. Solo `/panel` permite ancestros chrome-extension. Una vez conocido el ID definitivo de tienda, el administrador puede restringir esa política a ese origen exacto desde Pages, sin republicar la extensión. No lo hagas antes si aún necesitas la copia descomprimida.
- Cloudflare usa rutas HTML canónicas sin extensión. El contenedor usa `/panel`; no elimines su encabezado específico al ajustar `_headers`. Las rutas inexistentes devuelven 404, sin cargar una copia alternativa del CRM sin protección de marcos.
- Si el almacenamiento de terceros está bloqueado por políticas de Chrome, el CRM usa memoria durante la sesión, conserva el operador/firma en la extensión y advierte que pedirá nuevamente el token tras recargar. Permitir el sitio o abrir el CRM en una pestaña permite usar el almacenamiento normal. No se eluden políticas del navegador ni se transfiere el token al contenedor. En ese modo el identificador de dispositivo y recordatorios descartados pueden reiniciarse al recargar.
- Una caída de Pages muestra reintento; las nuevas funcionalidades no estarán disponibles hasta un despliegue exitoso. No borres D1 para actualizar código.
