import React,{useState} from 'react';
import {eventEnd,localDateTime} from '../../shared/calendar.js';
import {Button,Field,Form} from './UI.jsx';
export default function CalendarEventEditor({initial,data,operator,busy,onSave,onCancel,defaultDay,spaceId}){
 const e=initial||{},[id]=useState(()=>e.id||crypto.randomUUID());
 const [start,setStart]=useState(e.datetime?localDateTime(e.datetime):`${defaultDay}T09:00`),[end,setEnd]=useState(e.datetime?localDateTime(eventEnd(e)):`${defaultDay}T10:00`),[error,setError]=useState('');
 function changeStart(value){setStart(value);if(value&&(!end||end<=value))setEnd(localDateTime(new Date(Date.parse(value+':00-05:00')+3600000).toISOString()));}
 return <Form className="stack card-form" onSave={async f=>{
  if(!start||!end||end<=start){setError('El fin debe ser posterior al inicio del evento.');return;}
  setError('');await onSave({...e,id,space_id:f.get('space_id')||null,title:f.get('title'),datetime:new Date(start+':00-05:00').toISOString(),end_datetime:new Date(end+':00-05:00').toISOString(),participants:f.get('participants'),description:f.get('description'),location:f.get('location'),link:f.get('link'),status:f.get('status')});
 }}>
 <Field label="Título del evento" name="title" required maxLength={500} defaultValue={e.title||''}/>
 <div className="two-col"><Field label="Inicio del evento (hora de Perú)"><input type="datetime-local" value={start} required onChange={event=>changeStart(event.target.value)}/></Field><Field label="Fin del evento (hora de Perú)"><input type="datetime-local" value={end} required min={start} onChange={event=>setEnd(event.target.value)}/></Field></div>
 <Field label="Vincular a un contacto (opcional)"><select name="space_id" defaultValue={e.space_id||spaceId||''}><option value="">Evento general del equipo</option>{data.spaces.map(s=><option key={s.id} value={s.id}>{s.name}{s.cut_code?' · '+s.cut_code:''}</option>)}</select></Field>
 <Field label="Descripción del evento"><textarea name="description" rows={3} maxLength={20000} defaultValue={e.description||''}/></Field>
 <Field label="Participantes" name="participants" maxLength={3000} defaultValue={e.participants||operator}/>
 <Field label="Lugar o sala" name="location" maxLength={500} defaultValue={e.location||''}/>
 <Field label="Enlace de videollamada (opcional)" name="link" type="url" maxLength={2000} defaultValue={e.link||''}/>
 <Field label="Estado del evento"><select name="status" defaultValue={e.status||'Programada'}>{['Programada','Realizada','Cancelada'].map(value=><option key={value}>{value}</option>)}</select></Field>
 <small>El evento se comparte con el equipo. Después de guardar puedes añadirlo a tu calendario personal.</small>
 {error&&<p role="alert" className="error">{error}</p>}
 <div className="row wrap"><Button disabled={busy||!operator}>{initial?'Guardar evento':'Crear evento'}</Button><Button type="button" kind="quiet" onClick={onCancel}>Cancelar</Button></div>
 </Form>;
}
