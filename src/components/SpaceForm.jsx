import React,{useState} from 'react';
import {STATUSES,UNITS} from '../../shared/domain.js';
import {Button,Field,Form,Modal} from './UI.jsx';
export default function SpaceForm({initial,members,onSave,onClose,busy,units=UNITS,onAddUnit}){
 const s=initial||{},[unit,setUnit]=useState(s.org_unit||'ALA'),[adding,setAdding]=useState(false),[newUnit,setNewUnit]=useState('');
 return <Modal title={s.id?'Editar espacio':'Nuevo espacio de contacto'} onClose={onClose}><Form className="form-grid" onSave={async f=>{
   const saved=await onSave({...s,id:s.id||crypto.randomUUID(),name:f.get('name'),phone_or_group_id:f.get('phone'),role:f.get('role'),email:f.get('email'),extension:f.get('extension'),office:f.get('office'),entity:f.get('entity'),location:f.get('location'),org_unit:f.get('unit'),status:f.get('status'),cut_code:f.get('cut'),doc_ref:f.get('doc'),assignees:f.getAll('assignees')});if(saved)onClose();
 }}>
 <Field label="Nombre del contacto o grupo" name="name" required maxLength={200} defaultValue={s.name||''}/>
 <Field label="Teléfono internacional o ID de grupo" name="phone" required maxLength={200} defaultValue={s.phone_or_group_id||''}/>
 <Field label="Cargo" name="role" maxLength={300} defaultValue={s.role||''}/>
 <div className="unit-control"><Field label="Órgano / Unidad"><select name="unit" value={unit} onChange={e=>setUnit(e.target.value)}>{[...new Set([...units,unit])].map(u=><option key={u}>{u}</option>)}</select></Field>{onAddUnit&&!adding&&<Button type="button" kind="quiet" disabled={busy} onClick={()=>setAdding(true)}>Añadir órgano/unidad</Button>}{adding&&<div className="new-unit"><Field label="Nombre del nuevo órgano/unidad"><input value={newUnit} maxLength={80} onChange={e=>setNewUnit(e.target.value)}/></Field><div className="row wrap"><Button type="button" disabled={busy||!newUnit.trim()} onClick={async()=>{const name=newUnit.trim().replace(/\s+/g,' ');if(await onAddUnit(name)){setUnit(name);setNewUnit('');setAdding(false);}}}>Guardar unidad</Button><Button type="button" kind="quiet" disabled={busy} onClick={()=>{setAdding(false);setNewUnit('');}}>Cancelar unidad</Button></div></div>}</div>
 <Field label="Correo institucional" name="email" type="email" maxLength={254} defaultValue={s.email||''}/>
 <Field label="Anexo" name="extension" maxLength={50} defaultValue={s.extension||''}/>
 <Field label="Dirección / AAA / ALA / Oficina" name="office" maxLength={300} defaultValue={s.office||''}/>
 <Field label="Entidad (ANA, MIDAGRI, GORE, Junta de Usuarios u otra)" name="entity" maxLength={300} defaultValue={s.entity||''}/>
 <Field label="Ubicación / dirección" name="location" maxLength={500} defaultValue={s.location||''}/>
 <Field label="Estado de gestión"><select name="status" defaultValue={s.status||'Pendiente'}>{STATUSES.map(u=><option key={u}>{u}</option>)}</select></Field>
 <Field label="Código CUT" name="cut" maxLength={100} defaultValue={s.cut_code||''}/>
 <Field label="Documento de referencia" name="doc" maxLength={500} defaultValue={s.doc_ref||''}/>
 <fieldset className="full"><legend>Responsables asignados</legend><div className="check-group">{members.map(m=><label key={m}><input type="checkbox" name="assignees" value={m} defaultChecked={s.assignees?.includes(m)}/>{m}</label>)}</div></fieldset>
 <footer className="form-actions full"><Button type="button" kind="secondary" onClick={onClose}>Cancelar</Button><Button disabled={busy||adding}>Guardar espacio</Button></footer>
 </Form></Modal>;
}
