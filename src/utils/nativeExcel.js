import * as XLSX from 'xlsx';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {reportTables} from '../../shared/domain.js';
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
const PKG='http://schemas.openxmlformats.org/package/2006/relationships';
const XML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const headers=[
 ['Integrante_Equipo','Espacios_Asignados','Coordinaciones_Urgentes','Para_Visto_Bueno','Tareas_Pendientes','Tareas_Completadas','Porcentaje_Avance'],
 ['ID_Espacio','Nombre_Contacto_o_Grupo','Cargo','Organo_Unidad','Oficina','Entidad','Correo','Anexo','Ubicacion','Telefono_WhatsApp','Codigo_CUT','Documento_Referencia','Estado_Gestion','Responsables_Equipo','Ultima_Actualizacion'],
 ['ID_Tarea','Espacio_ID','Codigo_CUT','Contacto_Espacio','Organo','Descripcion_Tarea','Responsable','Autor','Fecha_Limite','Fecha_Hora_Limite','Estado','Texto_Origen','Tipo_Origen'],
 ['ID_Nota','Espacio_ID','Fecha_Hora','Autor_Equipo','Contacto_Espacio','Codigo_CUT','Actualizacion_Registrada'],
 ['ID_Reunion','Espacio_ID','Tipo_Registro','Descripcion','Fecha_Hora_Reunion','Fecha_Hora_Fin','Titulo_Reunion','Contacto_Espacio','Codigo_CUT','Participantes','Enlace_Sala','Sala_Presencial','Estado_Reunion','Acuerdos_Pactados','Autor']
];
const tableNames=['Resumen_KPIs','Agenda_Espacios','Tareas_y_CUTs','Bitacora_Historica','Reuniones_Acuerdos'];
const esc=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const col=XLSX.utils.encode_col;
function addPart(files,path,xml){files[path]=strToU8(xml);}
function appendXml(files,path,tag,content){const xml=strFromU8(files[path]);files[path]=strToU8(xml.replace('</'+tag+'>',content+'</'+tag+'>'));}
function relationship(files,path,id,type,target){if(!files[path])addPart(files,path,XML+`<Relationships xmlns="${PKG}"></Relationships>`);appendXml(files,path,'Relationships',`<Relationship Id="${id}" Type="${REL+type}" Target="${target}"/>`);}
function contentType(files,path,type){appendXml(files,'[Content_Types].xml','Types',`<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.${type}+xml"/>`);}
function pivotPlan(rows,fields,rowKey,columnKey,idKey,name,title,row){
 const rowLabels=[...new Set(rows.map(r=>String(r[rowKey]??'')))],columnLabels=[...new Set(rows.map(r=>String(r[columnKey]??'')))];
 const matrix=[[title],[rowKey,...columnLabels,'Total general']];
 for(const label of rowLabels){const selected=rows.filter(r=>String(r[rowKey]??'')===label);matrix.push([label,...columnLabels.map(c=>selected.filter(r=>String(r[columnKey]??'')===c).length),selected.length]);}
 matrix.push(['Total general',...columnLabels.map(c=>rows.filter(r=>String(r[columnKey]??'')===c).length),rows.length]);
 return {rows,fields,rowKey,columnKey,idKey,name,title,row,rowLabels,columnLabels,matrix,ref:`A${row+2}:${col(columnLabels.length+1)}${row+matrix.length}`};
}
export function createMasterWorkbook(data){
 const tables=reportTables(data),wb=XLSX.utils.book_new();
 Object.entries(tables).forEach(([name,rows],i)=>{
  const sheet=XLSX.utils.json_to_sheet(rows,{header:headers[i]});
  sheet['!cols']=headers[i].map(key=>({wch:Math.min(55,Math.max(18,key.length+3))}));
  sheet['!autofilter']={ref:`A1:${col(headers[i].length-1)}${Math.max(2,rows.length+1)}`};
  XLSX.utils.book_append_sheet(wb,sheet,name);
 });return wb;
}
export function createMasterExcelBytes(data){
 const tables=Object.values(reportTables(data)),wb=createMasterWorkbook(data);let row=tables[0].length+5;
 const plans=[
  [tables[2],headers[2],'Responsable','Estado','ID_Tarea','CargaTareasOperador','TAREAS POR OPERADOR Y ESTADO',2],
  [tables[1],headers[1],'Organo_Unidad','Estado_Gestion','ID_Espacio','CoordinacionesOrgano','COORDINACIONES POR ÓRGANO Y ESTADO',1],
  [tables[4],headers[4],'Contacto_Espacio','Estado_Reunion','ID_Reunion','ReunionesContacto','REUNIONES POR CONTACTO Y ESTADO',4]
 ].map(args=>{const source=args.pop(),plan=pivotPlan(...args,row);row+=plan.matrix.length+4;plan.source=source;XLSX.utils.sheet_add_aoa(wb.Sheets[wb.SheetNames[0]],plan.matrix,{origin:{r:plan.row,c:0}});return plan;});
 const files=unzipSync(new Uint8Array(XLSX.write(wb,{type:'array',bookType:'xlsx'})));
 // Tablas estructuradas: se pueden importar por nombre en Power Query.
 tables.forEach((rows,i)=>{
  const ref=`A1:${col(headers[i].length-1)}${Math.max(2,rows.length+1)}`,path=`xl/tables/table${i+1}.xml`,rid='rIdDataTable';
  addPart(files,path,XML+`<table xmlns="${NS}" id="${i+1}" name="${tableNames[i]}" displayName="${tableNames[i]}" ref="${ref}" totalsRowShown="0"><autoFilter ref="${ref}"/><tableColumns count="${headers[i].length}">${headers[i].map((h,j)=>`<tableColumn id="${j+1}" name="${esc(h)}"/>`).join('')}</tableColumns><tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`);
  contentType(files,path,'table');relationship(files,`xl/worksheets/_rels/sheet${i+1}.xml.rels`,rid,'table',`../tables/table${i+1}.xml`);
  appendXml(files,`xl/worksheets/sheet${i+1}.xml`,'worksheet',`<tableParts count="1"><tablePart r:id="${rid}"/></tableParts>`);
 });
 let cacheRefs='',pivotRefs='';
 plans.forEach((p,index)=>{
  const n=index+1,cacheId=index,shared=p.fields.map(key=>[...new Set(p.rows.map(r=>String(r[key]??'')))]),ri=p.fields.indexOf(p.rowKey),ci=p.fields.indexOf(p.columnKey),di=p.fields.indexOf(p.idKey);
  const cachePath=`xl/pivotCache/pivotCacheDefinition${n}.xml`,recordPath=`xl/pivotCache/pivotCacheRecords${n}.xml`,pivotPath=`xl/pivotTables/pivotTable${n}.xml`;
  const sourceRef=`A1:${col(p.fields.length-1)}${Math.max(2,p.rows.length+1)}`;
  addPart(files,cachePath,XML+`<pivotCacheDefinition xmlns="${NS}" xmlns:r="${REL.slice(0,-1)}" r:id="rIdRecords" recordCount="${p.rows.length}" saveData="1" refreshOnLoad="1" enableRefresh="1" createdVersion="6" refreshedVersion="6" minRefreshableVersion="3"><cacheSource type="worksheet"><worksheetSource ref="${sourceRef}" sheet="${esc(wb.SheetNames[p.source])}"/></cacheSource><cacheFields count="${p.fields.length}">${p.fields.map((field,i)=>`<cacheField name="${esc(field)}" numFmtId="0"><sharedItems count="${shared[i].length}" containsString="1" containsNumber="0" containsSemiMixedTypes="0">${shared[i].map(s=>`<s v="${esc(s)}"/>`).join('')}</sharedItems></cacheField>`).join('')}</cacheFields></pivotCacheDefinition>`);
  addPart(files,recordPath,XML+`<pivotCacheRecords xmlns="${NS}" count="${p.rows.length}">${p.rows.map(row=>`<r>${p.fields.map((field,i)=>`<x v="${shared[i].indexOf(String(row[field]??''))}"/>`).join('')}</r>`).join('')}</pivotCacheRecords>`);
  const fields=p.fields.map((_,i)=>{
   if(i===ri||i===ci){const values=i===ri?p.rowLabels:p.columnLabels;return `<pivotField axis="${i===ri?'axisRow':'axisCol'}" showAll="0" defaultSubtotal="0"><items count="${values.length+1}">${values.map(v=>`<item x="${shared[i].indexOf(v)}"/>`).join('')}<item t="default"/></items></pivotField>`;}
   return `<pivotField ${i===di?'dataField="1" ':''}showAll="0"/>`;
  }).join('');
  const rowItems=p.rowLabels.map((_,i)=>`<i><x v="${i}"/></i>`).join('')+'<i t="grand"><x/></i>';
  const colItems=p.columnLabels.map((_,i)=>`<i><x v="${i}"/></i>`).join('')+'<i t="grand"><x/></i>';
  addPart(files,pivotPath,XML+`<pivotTableDefinition xmlns="${NS}" name="${p.name}" cacheId="${cacheId}" dataCaption="Cantidad" grandTotalCaption="Total general" updatedVersion="6" minRefreshableVersion="3" createdVersion="6" rowGrandTotals="1" colGrandTotals="1" compact="0" compactData="0" outline="0" gridDropZones="1" multipleFieldFilters="0"><location ref="${p.ref}" firstHeaderRow="0" firstDataRow="1" firstDataCol="1"/><pivotFields count="${p.fields.length}">${fields}</pivotFields><rowFields count="1"><field x="${ri}"/></rowFields><rowItems count="${p.rowLabels.length+1}">${rowItems}</rowItems><colFields count="1"><field x="${ci}"/></colFields><colItems count="${p.columnLabels.length+1}">${colItems}</colItems><dataFields count="1"><dataField name="Cantidad" fld="${di}" subtotal="count" baseField="0" baseItem="0"/></dataFields><pivotTableStyleInfo name="PivotStyleMedium9" showRowHeaders="1" showColHeaders="1" showRowStripes="1" showColStripes="0" showLastColumn="1"/></pivotTableDefinition>`);
  contentType(files,cachePath,'pivotCacheDefinition');contentType(files,recordPath,'pivotCacheRecords');contentType(files,pivotPath,'pivotTable');
  relationship(files,`xl/pivotCache/_rels/pivotCacheDefinition${n}.xml.rels`,'rIdRecords','pivotCacheRecords',`pivotCacheRecords${n}.xml`);
  relationship(files,`xl/pivotTables/_rels/pivotTable${n}.xml.rels`,'rIdCache','pivotCacheDefinition',`../pivotCache/pivotCacheDefinition${n}.xml`);
  relationship(files,'xl/_rels/workbook.xml.rels','rIdAnaCache'+n,'pivotCacheDefinition',`pivotCache/pivotCacheDefinition${n}.xml`);
  relationship(files,'xl/worksheets/_rels/sheet1.xml.rels','rIdAnaPivot'+n,'pivotTable',`../pivotTables/pivotTable${n}.xml`);
  cacheRefs+=`<pivotCache cacheId="${cacheId}" r:id="rIdAnaCache${n}"/>`;pivotRefs+=`<pivotTablePart r:id="rIdAnaPivot${n}"/>`;
 });
 appendXml(files,'xl/workbook.xml','workbook',`<pivotCaches>${cacheRefs}</pivotCaches>`);
 appendXml(files,'xl/worksheets/sheet1.xml','worksheet',`<pivotTableParts count="${plans.length}">${pivotRefs}</pivotTableParts>`);
 return zipSync(files,{level:6});
}
