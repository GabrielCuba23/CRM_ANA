# Dependencias de terceros

- React y React DOM: Meta y colaboradores, licencia MIT.
- Tailwind CSS: Tailwind Labs y colaboradores, licencia MIT.
- Vite y plugin React: colaboradores de Vite, licencia MIT.
- SheetJS Community Edition 0.20.3: SheetJS LLC, licencia Apache-2.0. Distribución del espejo comunitario npm `@e965/xlsx`, utilizada bajo el alias `xlsx`. Documentación oficial: https://docs.sheetjs.com/ . Fuente y licencia se incluyen en la distribución instalada. Esta aplicación genera documentos Excel; no acepta importación de archivos Excel.
- Cloudflare Wrangler y Miniflare: Cloudflare y colaboradores, licencias MIT/Apache-2.0 según paquete.
- Playwright: Microsoft, licencia Apache-2.0, usado para pruebas de desarrollo.

Las versiones exactas, dependencias transitivas e integridad de artefactos se registran en `package-lock.json`. El emblema de la Autoridad Nacional del Agua se incorpora a partir del archivo `LOGO ANA AZUL.png`, facilitado expresamente por el usuario para identificar esta plataforma. El original se conserva en `src/assets/ana-logo.png` sin modificaciones. La marca pertenece a su titular; su inclusión no implica una certificación de este software por ANA. No se incorporan logotipos de MIDAGRI ni de WhatsApp.

- jsPDF y jsPDF-AutoTable: licencias MIT, usados para generar PDF con texto y tablas.
- fflate: licencia MIT, usado para escribir tablas dinámicas y tablas estructuradas OOXML dentro del .xlsx.
- El proyecto Power BI sigue la estructura pública del ejemplo Microsoft Analysis-Services/SamplePBIP e incluye su tema base y licencia MIT en `powerbi/MICROSOFT-LICENSE.txt`. Los modelos, consultas, medidas y páginas específicas del CRM se generaron para esta entrega.
