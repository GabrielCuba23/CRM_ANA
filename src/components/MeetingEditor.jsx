import React,{useState} from 'react';
import {Button,Field,Form} from './UI.jsx';
export default function MeetingEditor({spaceId,initial,members,operator,onSave,onCancel,busy,locked}){
 const m=initial||{},[items,setItems]=useState(m.agreement_items||[]);
 function update(index,key,value){setItems(current=>current.map((a,i)=>i===index?{...a,[key]:value}:a));}
 return <Form className="stack card-form" onSave={async(f,form)=>{
  const ok=await onSave({...m,id:m.id||crypto.randomUUID(),space_id:spaceId,title:f.get('title'),datetime:new Date(f.get('datetime')+':00-05:00').toISOString(),link:f.get('link'),location:f.get('location'),participants:f.get('participants'),status:f.get('status'),agreements:f.get('agreements'),agreement_items:items});
  if(ok&&!initial){form.reset();setItems([]);}
 }}>
 <Field label="Tema de la reunión" name="title" required maxLength={500} defaultValue={m.title||''}/>
 <Field label="Fecha y hora (America/Lima)" type="datetime-local" name="datetime" required defaultValue={m.datetime?new Date(Date.parse(m.datetime)-5*3600000).toISOString().slice(0,16):''}/>
 <Field label="Enlace de Meet o Zoom (opcional)" type="url" name="link" maxLength={2000} defaultValue={m.link||''}/>
 <Field label="Sala presencial / ubicación" name="location" maxLength={500} defaultValue={m.location||''}/>
 <Field label="Participantes" name="participants" maxLength={3000} defaultValue={m.participants||''}/>
 <Field label="Estado de reunión"><select name="status" defaultValue={m.status||'Programada'}>{['Programada','Realizada','Cancelada'].map(s=><option key={s}>{s}</option>)}</select></Field>
 <Field label="Acuerdos · un acuerdo por línea"><textarea name="agreements" rows={3} maxLength={20000} defaultValue={m.agreements||''}/></Field>
 <fieldset className="agreement-editor"><legend>Acuerdos con responsable y fecha</legend>{items.map((a,i)=><div className="agreement-row" key={i}><Field label={`Acuerdo ${i+1}`}><input value={a.text} required maxLength={2000} disabled={locked} onChange={e=>update(i,'text',e.target.value)}/></Field><div className="two-col"><Field label={`Responsable del acuerdo ${i+1}`}><select value={a.assignee} required disabled={locked} onChange={e=>update(i,'assignee',e.target.value)}><option value="">Seleccionar</option>{[...new Set([...members,...(a.assignee?[a.assignee]:[])])].map(n=><option key={n}>{n}</option>)}</select></Field><Field label={`Fecha del acuerdo ${i+1}`}><input type="date" value={a.due_date} required disabled={locked} onChange={e=>update(i,'due_date',e.target.value)}/></Field></div>{!locked&&<Button type="button" kind="quiet" onClick={()=>setItems(current=>current.filter((_,index)=>index!==i))}>Quitar acuerdo {i+1}</Button>}</div>)}{!locked&&<Button type="button" kind="secondary" onClick={()=>setItems(current=>[...current,{text:'',assignee:operator||'',due_date:''}])} disabled={items.length>=100}>Añadir acuerdo con responsable</Button>}{locked&&<small>Los acuerdos ya tienen tareas vinculadas. Gestiona sus avances desde Tareas.</small>}</fieldset>
 <div className="row wrap"><Button disabled={busy||!operator}>{initial?'Guardar cambios':'Agendar reunión'}</Button>{initial&&<Button kind="quiet" type="button" onClick={onCancel}>Cancelar</Button>}</div>
 </Form>;
}
