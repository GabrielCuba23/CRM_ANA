# CRM ANA · Presentación interactiva

Presentación editable de **33 diapositivas**, formato panorámico 16:9, con el logo original y la paleta azul del CRM ANA. Documenta la aplicación web **1.3.0** y la extensión **1.2.1**, al 28 de octubre de 2026, hora de Perú.

- [Descargar PowerPoint interactivo](https://github.com/GabrielCuba23/CRM_ANA/raw/refs/heads/main/artifacts/CRM_ANA_Guia_Interactiva.pptx)
- [Descargar PDF para consulta](https://github.com/GabrielCuba23/CRM_ANA/raw/refs/heads/main/artifacts/CRM_ANA_Guia_Interactiva.pdf)

## Cómo presentarla

1. Descarga el archivo `.pptx` y ábrelo en Microsoft PowerPoint.
2. Elige **Presentación con diapositivas → Desde el principio**.
3. Pulsa **Comenzar** y elige una tarjeta del menú.
4. Usa **Menú**, las flechas y los accesos del pie para cambiar de recorrido. Los botones del mapa de funciones abren cada explicación.
5. En la autoevaluación, haz clic en una respuesta para ver la explicación y volver a intentar cuando corresponda.

Los enlaces de navegación son propios del formato PowerPoint; no hay macros, complementos, puntuaciones guardadas ni envío de respuestas. En edición, PowerPoint puede requerir Ctrl+clic o clic derecho → Abrir vínculo. El PDF es una copia para lectura; usa la PPTX para la navegación interactiva completa.

Las diapositivas y sus imágenes quedan incluidas en el archivo: no hace falta Internet para leer o navegar internamente. Abrir el CRM y las descargas externas sí requiere conexión y los permisos de acceso correspondientes. El token se solicita dentro del CRM; no está incluido en el material.

## Recorridos

| Diapositivas | Contenido |
| --- | --- |
| 1–3 | Inicio, menú interactivo y mapa de las 15 funciones. |
| 4–9 | Modos de acceso, requisitos, descarga, Chrome, ingreso y selección de operador. |
| 10–20 | Directorio, detección del chat, ficha, bitácora, tareas/Kanban, agenda, calendarios, reuniones, formatos, avisos, presencia y recordatorios. |
| 21–24 | Excel/PDF, proyecto Power BI, entrega de cargo y actualizaciones. |
| 25–28 | Diagnóstico de manifiesto, detección de chat y acceso/API. |
| 29–33 | Práctica guiada, pregunta interactiva, retroalimentación y recursos. |

Las notas del presentador incluyen instrucciones ampliadas y límites prácticos: el lector mantiene WhatsApp intacto; los envíos se confirman manualmente; los calendarios se exportan como copia; los recordatorios requieren el CRM abierto; restaurar reemplaza los datos. La distribución descomprimida mantiene la decisión de no pagar inscripción de Chrome Web Store. Power BI se plantea para uso local en Windows, sin contratar Pro.

## Procedencia y reproducción

Las capturas muestran la aplicación real, con contactos y registros de demostración en una D1 local aislada. Los operadores usados en los ejemplos pertenecen a la lista ya aprobada del proyecto. No contienen conversaciones, teléfonos reales ni datos de la D1 de producción. `capturas/procedencia.json` registra la fuente y las versiones. El logo se incrusta con los bytes originales de `src/assets/ana-logo.png`.

Con las dependencias del proyecto instaladas, la web compilada y el secreto de desarrollo configurado:

```bash
node scripts/presentation-captures.mjs
python3 scripts/create-training-presentation.py
soffice -env:UserInstallation=file:///tmp/crm-ana-ppt-profile --headless --convert-to pdf --outdir artifacts artifacts/CRM_ANA_Guia_Interactiva.pptx
python3 scripts/validate-training-presentation.py
```

El generador Python requiere `python-pptx` y Pillow; la validación PDF utiliza PyMuPDF. La conversión opcional requiere LibreOffice. No cambian las dependencias ni las funciones de la aplicación. Se incluyen el generador, las capturas y un índice de diapositivas para poder mantener el material.

La verificación comprende integridad OOXML, destinos de enlaces internos y externos, logo original incrustado, notas del presentador, revisión visual de las 33 diapositivas y exportación a PDF. No sustituye una ejecución nativa en PowerPoint ni la validación del proyecto Power BI en Windows.
