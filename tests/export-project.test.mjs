import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';
import {createMasterExcelBytes} from '../src/utils/excelExport.js';
import {createReportPdf} from '../src/utils/pdfExport.js';
const data={spaces:[{id:'s1',name:'Contacto',assignees:['Acxel'],org_unit:'ALA',status:'Urgente'}],members:['Acxel'],notes:[],tasks:[{id:'t1',space_id:'s1',title:'Revisar expediente',assignee:'Acxel',done:false,stage:'En proceso'}],meetings:[]};
test('el .xlsx contiene tablas dinámicas nativas y cinco tablas estructuradas',()=>{
 const files=unzipSync(createMasterExcelBytes(data));const names=Object.keys(files);
 assert.equal(names.filter(n=>/^xl\/pivotTables\/pivotTable\d+\.xml$/.test(n)).length,3);assert.equal(names.filter(n=>/^xl\/pivotCache\/pivotCacheDefinition\d+\.xml$/.test(n)).length,3);assert.equal(names.filter(n=>/^xl\/tables\/table\d+\.xml$/.test(n)).length,5);
 assert.match(strFromU8(files['xl/pivotTables/pivotTable1.xml']),/subtotal="count"/);assert.match(strFromU8(files['xl/pivotCache/pivotCacheDefinition1.xml']),/recordCount="1"/);assert.match(strFromU8(files['xl/workbook.xml']),/pivotCaches/);
 const empty=unzipSync(createMasterExcelBytes({...data,spaces:[],tasks:[],members:[]}));assert.match(strFromU8(empty['xl/pivotCache/pivotCacheDefinition1.xml']),/recordCount="0"/);
});
test('el reporte PDF produce un documento real con páginas de las cinco tablas',()=>{const pdf=createReportPdf(data);assert.ok(pdf.getNumberOfPages()>=5);assert.equal(new TextDecoder().decode(pdf.output('arraybuffer')).slice(0,5),'%PDF-');});
test('el proyecto Power BI tiene cinco páginas, referencias válidas y parámetros sin token',()=>{
 const files=unzipSync(readFileSync('public/powerbi/CRM_ANA_PowerBI.pbip.zip')),prefix='CRM_ANA_PowerBI/';
 const project=JSON.parse(strFromU8(files[prefix+'CRM_ANA.pbip']));assert.equal(project.artifacts[0].report.path,'CRM_ANA.Report');
 const report=JSON.parse(strFromU8(files[prefix+'CRM_ANA.Report/report.json']));assert.equal(report.sections.length,5);
 for(const page of report.sections)for(const visual of page.visualContainers){const c=JSON.parse(visual.config).singleVisual;for(const from of c.prototypeQuery.From)assert.ok(files[prefix+'CRM_ANA.SemanticModel/definition/tables/'+from.Entity+'.tmdl']);}
 const expressions=strFromU8(files[prefix+'CRM_ANA.SemanticModel/definition/expressions.tmdl']);assert.match(expressions,/expression pTeamToken = ""/);assert.match(expressions,/X-Team-Token/);assert.match(expressions,/Kind="Table"/);
});
