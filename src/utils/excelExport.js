import {createMasterWorkbook,createMasterExcelBytes} from './nativeExcel.js';
export {createMasterWorkbook,createMasterExcelBytes};
export function downloadMasterExcel(data){
 const bytes=createMasterExcelBytes(data),url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=document.createElement('a');a.href=url;a.download=`Reporte_Maestro_CRM_ANA_${new Date().toISOString().slice(0,10)}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
