import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {reportTables} from '../../shared/domain.js';
export function createReportPdf(data,{from='',to='',member=''}={}){
 const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 const tables=reportTables(data);let first=true;
 for(const [name,rows] of Object.entries(tables)){
  if(!first)pdf.addPage();first=false;
  pdf.setFont('helvetica','bold');pdf.setFontSize(16);pdf.setTextColor(41,87,164);pdf.text('ANA · Seguimiento de coordinaciones',14,16);
  pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(70);pdf.text(`${name} | ${from||'Inicio'} a ${to||'Actualidad'} | ${member||'Todo el equipo'}`,14,24);
  if(!rows.length){pdf.text('Sin registros para esta selección.',14,36);continue;}
  const keys=Object.keys(rows[0]);
  autoTable(pdf,{startY:30,head:[keys.map(k=>k.replaceAll('_',' '))],body:rows.map(row=>keys.map(k=>String(row[k]??''))),styles:{font:'helvetica',fontSize:6,cellPadding:2,overflow:'linebreak'},headStyles:{fillColor:[41,87,164]},alternateRowStyles:{fillColor:[243,246,252]},margin:{left:10,right:10}});
 }
 const pages=pdf.getNumberOfPages();for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(90);pdf.text(`Coordinación institucional · Página ${i} de ${pages}`,14,202);}
 return pdf;
}
export function downloadReportPdf(data,options){createReportPdf(data,options).save('Reporte_CRM_ANA_'+new Date().toISOString().slice(0,10)+'.pdf');}
