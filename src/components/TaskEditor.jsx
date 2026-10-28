import React,{useState} from 'react';
import {TASK_STAGES} from '../../shared/domain.js';
import {Button,Field,Form} from './UI.jsx';
export default function TaskEditor({data,spaceId,operator,initial,onSave,busy}){
 const t=initial||{},[title,setTitle]=useState(t.title||''),[source,setSource]=useState(t.source_text||'');
 return <Form className="stack card-form" onSave={async(f,form)=>{
  const stage=f.get('stage');
  const saved=await onSave({...t,id:t.id||crypto.randomUUID(),space_id:spaceId||f.get('space'),title,assignee:f.get('assignee'),due_date:f.get('due'),done:stage==='Completado',stage,source_text:source,source_type:f.get('source_type'),due_datetime:f.get('due_datetime')?new Date(f.get('due_datetime')+':00-05:00').toISOString():''});
  if(saved&&!initial){setTitle('');setSource('');form.reset();}
 }}>
 {!spaceId&&<Field label="Espacio de contacto"><select name="space" required defaultValue={t.space_id||''}><option value="">Seleccionar contacto</option>{data.spaces.map(s=><option key={s.id} value={s.id}>{s.name} · {s.cut_code||'Sin CUT'}</option>)}</select></Field>}
 <Field label="Nueva tarea"><input name="title" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={500}/></Field>
 <div className="two-col"><Field label="Responsable"><select name="assignee" required defaultValue={t.assignee||operator||''}><option value="">Seleccionar</option>{data.members.map(m=><option key={m}>{m}</option>)}</select></Field><Field label="Estado de tarea"><select name="stage" defaultValue={t.stage||(t.done?'Completado':'Por hacer')}>{TASK_STAGES.map(s=><option key={s}>{s}</option>)}</select></Field></div>
 <div className="two-col"><Field label="Fecha límite" name="due" type="date" defaultValue={t.due_date||''}/><Field label="Fecha y hora límite (Perú, opcional)" name="due_datetime" type="datetime-local" defaultValue={t.due_datetime?new Date(Date.parse(t.due_datetime)-5*3600000).toISOString().slice(0,16):''}/></div>
 <details className="source-editor" open={!!source}><summary>Convertir texto o referencia de WhatsApp en tarea</summary><Field label="Tipo de origen"><select name="source_type" defaultValue={t.source_type||'Texto'}>{['Texto','Audio','Documento','Acuerdo'].map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Mensaje o referencia de origen"><textarea rows={3} maxLength={20000} value={source} onChange={e=>{setSource(e.target.value);if(!title)setTitle(e.target.value.split('\n')[0].slice(0,120));}}/></Field><small>Copia y pega el texto aquí. Para audio o documento registra su transcripción o referencia. El lector mantiene WhatsApp intacto.</small></details>
 <Button disabled={busy||!operator}>{initial?'Guardar tarea':'Agregar tarea'}</Button>
 </Form>;
}
