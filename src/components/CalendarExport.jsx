import React from 'react';
import {googleCalendarUrl,calendarDescription} from '../../shared/calendar.js';
import {downloadCalendar} from '../utils/calendarExport.js';
import {Button,Icon} from './UI.jsx';
export default function CalendarExport({event,space,notify}){
 const googleUrl=googleCalendarUrl(event,space),shortened=new URL(googleUrl).searchParams.get('details')!==calendarDescription(event,space);
 return <div className="calendar-export"><div className="row wrap">{event.status!=='Cancelada'&&<a className="btn secondary" href={googleUrl} target="_blank" rel="noreferrer" aria-label={`Añadir ${event.title} a Google Calendar`}>Google Calendar ↗</a>}<Button kind="secondary" onClick={()=>{try{downloadCalendar([event],space?[space]:[]);}catch(e){notify?.(e.message,true);}}} aria-label={`Exportar ${event.title} para Apple Calendar u Outlook`}><Icon name="download" size={16}/>Apple / Outlook (.ics)</Button></div>{shortened&&<small>Google recibirá un resumen por el tamaño del enlace. El archivo .ics conserva el texto completo.</small>}</div>;
}
