export function calendarItems(data){
 return [...(data.meetings||[]).map(m=>({...m,kind:'meeting'})),...(data.calendar_events||[]).map(e=>({...e,kind:'event'}))].sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime));
}
export function eventEnd(event){return event.end_datetime||new Date(Date.parse(event.datetime)+3600000).toISOString();}
export function localDateTime(value){return new Date(Date.parse(value)-5*3600000).toISOString().slice(0,16);}
function stamp(value){const date=new Date(value);if(!Number.isFinite(date.getTime()))throw new Error('El evento tiene una fecha inválida.');return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
export function calendarDescription(event,space){
 const agreements=[...(event.agreements||'').split('\n').filter(Boolean),...(event.agreement_items||[]).map(a=>`${a.text} | Responsable: ${a.assignee||'Por asignar'} | Fecha: ${a.due_date||'Sin fecha'}`)];
 return [event.description,space?.name&&`Contacto: ${space.name}`,space?.cut_code&&`CUT: ${space.cut_code}`,event.participants&&`Participantes: ${event.participants}`,event.link&&`Enlace: ${event.link}`,agreements.length&&`Acuerdos:\n${agreements.join('\n')}`].filter(Boolean).join('\n\n');
}
export function googleCalendarUrl(event,space){
 const url=new URL('https://calendar.google.com/calendar/render');
 const values={action:'TEMPLATE',text:event.title,dates:stamp(event.datetime)+'/'+stamp(eventEnd(event)),details:calendarDescription(event,space),location:[event.location,event.link].filter(Boolean).join(' · '),ctz:'America/Lima'};
 for(const [key,value] of Object.entries(values))url.searchParams.set(key,value);
 for(const key of ['details','location','text']){
  let characters=Array.from(url.searchParams.get(key));
  while(url.href.length>7500&&characters.length){characters=characters.slice(0,Math.floor(characters.length*.8));url.searchParams.set(key,characters.join(''));}
 }
 return url.href;
}
function escapeText(value){return String(value||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function foldLine(line){
 const lines=[];let current='',bytes=0;
 for(const character of line){const length=new TextEncoder().encode(character).length;if(bytes+length>75){lines.push(current);current=' ';bytes=1;}current+=character;bytes+=length;}
 lines.push(current);return lines.join('\r\n');
}
export function createCalendarIcs(events,spaces=[],now=new Date()){
 const map=new Map(spaces.map(s=>[s.id,s])),lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CRM ANA//Agenda compartida//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Agenda de coordinación ANA','X-WR-TIMEZONE:America/Lima'];
 for(const event of events){
  if(Date.parse(eventEnd(event))<=Date.parse(event.datetime))throw new Error('La hora final debe ser posterior al inicio.');
  lines.push('BEGIN:VEVENT',`UID:${event.kind||'meeting'}-${encodeURIComponent(event.id)}@crm-ana`, `DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(event.datetime)}`,`DTEND:${stamp(eventEnd(event))}`,`SUMMARY:${escapeText(event.title)}`,`DESCRIPTION:${escapeText(calendarDescription(event,map.get(event.space_id)))}`,`LOCATION:${escapeText([event.location,event.link].filter(Boolean).join(' · '))}`,`STATUS:${event.status==='Cancelada'?'CANCELLED':'CONFIRMED'}`,`SEQUENCE:${Number.isSafeInteger(event.revision)?event.revision:0}`,'CLASS:PRIVATE','TRANSP:OPAQUE');
  if(event.created_at)lines.push('CREATED:'+stamp(event.created_at));
  if(event.updated_at||event.created_at)lines.push('LAST-MODIFIED:'+stamp(event.updated_at||event.created_at));
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
}
