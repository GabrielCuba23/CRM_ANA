import React from 'react';
import {STATUSES,UNITS} from '../../shared/domain.js';
import {Button,Field,Form,Modal} from './UI.jsx';
export default function SpaceForm({initial,members,onSave,onClose,busy}){
 const s=initial||{};
 return <Modal title={s.id?'Editar espacio':'Nuevo espacio de contacto'} onClose={onClose}><Form className="form-grid" onSave={async f=>{
   const saved=await onSave({...s,id:s.id||crypto.randomUUID(),name:f.get('name'),phone_or_group_id:f.get('phone'),role:f.get('role'),org_unit:f.get('unit'),status:f.get('status'),cut_code:f.get('cut'),doc_ref:f.get('doc'),assignees:f.getAll('assignees')});if(saved)onClose();
 }}>
 <Field label="Nombre del contacto o grupo" name="name" required maxLength={200} defaultValue={s.name||''}/>
 <Field label="Teléfono internacional o ID de grupo" name="phone" required maxLength={200} defaultValue={s.phone_or_group_id||''}/>
 <Field label="Cargo" name="role" maxLength={300} defaultValue={s.role||''}/>
 <Field label="Órgano / Unidad"><select name="unit" defaultValue={s.org_unit||'ALA'}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></Field>
 <Field label="Estado de gestión"><select name="status" defaultValue={s.status||'Pendiente'}>{STATUSES.map(u=><option key={u}>{u}</option>)}</select></Field>
 <Field label="Código CUT" name="cut" maxLength={100} defaultValue={s.cut_code||''}/>
 <Field label="Documento de referencia" name="doc" maxLength={500} defaultValue={s.doc_ref||''}/>
 <fieldset className="full"><legend>Responsables asignados</legend><div className="check-group">{members.map(m=><label key={m}><input type="checkbox" name="assignees" value={m} defaultChecked={s.assignees?.includes(m)}/>{m}</label>)}</div></fieldset>
 <footer className="form-actions full"><Button type="button" kind="secondary" onClick={onClose}>Cancelar</Button><Button disabled={busy}>Guardar espacio</Button></footer>
 </Form></Modal>;
}
