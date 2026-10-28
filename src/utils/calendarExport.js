import {createCalendarIcs} from '../../shared/calendar.js';
export function downloadCalendar(events,spaces){
 const content=createCalendarIcs(events,spaces),url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=events.length===1?`evento-ana-${events[0].id.replace(/[^a-z0-9_-]/gi,'_')}.ics`:'agenda-ana.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
