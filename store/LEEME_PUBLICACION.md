# Publicación con cero pagos adicionales

El usuario indicó que no autoriza pagos adicionales. No se debe aceptar una inscripción de pago, contratar licencias ni activar suscripciones para esta publicación o para Power BI.

Chrome Web Store exige una inscripción de pago única para cuentas de desarrollador nuevas. Una cuenta ya habilitada puede publicar y actualizar sus elementos sin un cargo por versión. Poder abrir la consola no garantiza que esa inscripción esté completada: si al crear un elemento Google muestra un importe, se detiene el proceso sin pagar.

Si la cuenta permite subir archivos:

1. En Nuevo elemento sube **crm-ana-extension.zip** directamente. Su raíz contiene manifest.json, versión 1.2.1. No subas el ZIP del proyecto completo ni el ZIP de material gráfico.
2. El material en `materiales/` contiene tres capturas de la aplicación web real, con datos sintéticos en una base local aislada: 1280 × 800 px. La imagen promocional es 440 × 280 y el icono 128 × 128. Los textos están separados en archivos para copiar en la ficha.
3. La política de privacidad es https://crm-whatsapp-ana.pages.dev/privacy.html.
4. Revisa los permisos y el uso del iframe HTTPS con las declaraciones de FICHA_TIENDA.md. Introduce el nombre y correo verificado del publicador real en la consola de Google.
5. Selecciona visibilidad **No listada**. El token del equipo sigue siendo necesario para acceder al CRM. Un enlace No listado puede compartirse y no equivale a una restricción de instalación por persona.
6. Si Google requiere acceso para probar las funciones, se prepara un acceso de revisión con datos aislados; no se comparte el token maestro institucional. No se ha aprovisionado ese acceso ni se han enviado credenciales a Google.
7. Completa los campos que solicite Google y envía a revisión cuando el formulario esté completo. La aprobación y los plazos corresponden a Google. Este repositorio no supone que la extensión ya esté enviada o publicada.

Si la cuenta pide pagar, se mantiene el contenedor descomprimido. La interfaz y la API siguen actualizándose desde Cloudflare. Los cambios locales del lector requieren reemplazar la extensión manualmente. Chrome no ofrece el mismo mecanismo de distribución automática de tienda para una copia descomprimida en un equipo normal.

El material se puede reproducir con `node scripts/store-materials.mjs` después de compilar y disponer de Chromium. Usa exclusivamente D1 local de prueba; no crea eventos externos ni publica contenido.

Power BI se abordará después: Power BI Desktop permite trabajar localmente sin licencia Pro y requiere Windows. Compartir mediante Power BI Service o funciones adicionales puede exigir licencias; no se contratarán bajo esta restricción de presupuesto. El proyecto preparado está en `powerbi/` y no contiene un token real.
