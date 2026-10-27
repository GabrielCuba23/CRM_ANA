import * as XLSX from 'xlsx';
import {reportTables} from '../../shared/domain.js';
export function createMasterWorkbook(data){
 const workbook=XLSX.utils.book_new();
 for(const [name,rows] of Object.entries(reportTables(data))){
  const sheet=XLSX.utils.json_to_sheet(rows);
  if(!rows.length)XLSX.utils.sheet_add_aoa(sheet,[['Sin registros']],{origin:'A1'});
  sheet['!cols']=Object.keys(rows[0]||{Estado:0}).map(key=>({wch:Math.min(55,Math.max(18,key.length+3))}));
  if(sheet['!ref'])sheet['!autofilter']={ref:sheet['!ref']};
  XLSX.utils.book_append_sheet(workbook,sheet,name);
 }
 return workbook;
}
export function downloadMasterExcel(data){XLSX.writeFile(createMasterWorkbook(data),`Reporte_Maestro_CRM_ANA_${new Date().toISOString().slice(0,10)}.xlsx`);}
