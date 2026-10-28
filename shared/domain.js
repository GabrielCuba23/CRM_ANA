export const TASK_STAGES=['Por hacer','En proceso','En revisión','Completado'];
export const STATUSES=['Urgente','Pendiente','En elaboración','Para V°B°','Cerrado'];
export const UNITS=['ALA','AAA','DCERH','DARH','DPDRH','OAJ','OA','OPP','MIDAGRI','Externo'];
export function identity(value) {
  const raw=String(value||'').trim();
  if (/^\+?[\d\s().-]{7,25}$/.test(raw)) return raw.replace(/[^\d]/g,'');
  return raw.normalize('NFKC').toLocaleLowerCase('es-PE');
}
export function folded(value) {return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
export function filterSpaces(data,search='',tray='Todos',operator='') {
 const needle=folded(search);
 return data.spaces.filter(s=>{
   if(tray==='Mis Coordinaciones' && !s.assignees.includes(operator)) return false;
   if(STATUSES.includes(tray) && s.status!==tray) return false;
   const text=[s.name,s.role,s.phone_or_group_id,s.org_unit,s.office,s.entity,s.email,s.extension,s.cut_code,s.doc_ref,...s.assignees,
     ...data.notes.filter(n=>n.space_id===s.id).map(n=>n.content),
     ...data.tasks.filter(t=>t.space_id===s.id).map(t=>t.title)].join(' ');
   return !needle||folded(text).includes(needle);
 });
}
export function matchChat(spaces,title) {
 const id=identity(title);
 if(!id) return [];
 const exact=spaces.filter(s=>identity(s.phone_or_group_id)===id);
 return exact.length?exact:spaces.filter(s=>folded(s.name.trim())===folded(title.trim()));
}
export function signedText(text,operator,enabled) {return enabled?`${text.trim()}\n\n*${operator} - Coord. ANA*`:text.trim();}
export function agreementLines(meeting){
 return [...(meeting.agreements||'').split('\n').filter(x=>x.trim()).map(x=>x.trim()),...(meeting.agreement_items||[]).map(a=>`${a.text} | Responsable: ${a.assignee||'Por asignar'} | Cumplimiento: ${a.due_date||'Sin fecha'}`)];
}
export function minuteText(meeting,space) {
 return [`MINUTA · ${meeting.title}`,`Contacto: ${space?.name||''}`,`CUT: ${space?.cut_code||'Sin CUT'}`,
 `Fecha: ${new Date(meeting.datetime).toLocaleString('es-PE',{timeZone:'America/Lima'})} (Perú)`,
 `Participantes: ${meeting.participants||'No registrados'}`,`Sala: ${meeting.location||(meeting.link?'Virtual':'Presencial')}`,...(meeting.link?[`Enlace: ${meeting.link}`]:[]),
 '', 'ACUERDOS',...agreementLines(meeting).map((line,i)=>`${i+1}. ${line}`)].join('\n');
}
export function reportTables(data) {
 const map=Object.fromEntries(data.spaces.map(s=>[s.id,s]));
 return {
 '1_Resumen_KPIs':data.members.map(member=>{
   const spaces=data.spaces.filter(s=>s.assignees.includes(member)),tasks=data.tasks.filter(t=>t.assignee===member);
   return {Integrante_Equipo:member,Espacios_Asignados:spaces.length,Coordinaciones_Urgentes:spaces.filter(s=>s.status==='Urgente').length,
    Para_Visto_Bueno:spaces.filter(s=>s.status==='Para V°B°').length,Tareas_Pendientes:tasks.filter(t=>!t.done).length,
    Tareas_Completadas:tasks.filter(t=>t.done).length,Porcentaje_Avance:tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0};
 }),
 '2_Agenda_Espacios':data.spaces.map(s=>({ID_Espacio:s.id,Nombre_Contacto_o_Grupo:s.name,Cargo:s.role,Organo_Unidad:s.org_unit,Oficina:s.office||'',Entidad:s.entity||'',Correo:s.email||'',Anexo:s.extension||'',Ubicacion:s.location||'',Telefono_WhatsApp:s.phone_or_group_id,Codigo_CUT:s.cut_code,Documento_Referencia:s.doc_ref,Estado_Gestion:s.status,Responsables_Equipo:s.assignees.join(', '),Ultima_Actualizacion:s.updated_at})),
 '3_Tareas_y_CUTs':data.tasks.map(t=>({ID_Tarea:t.id,Espacio_ID:t.space_id,Codigo_CUT:map[t.space_id]?.cut_code||'',Contacto_Espacio:map[t.space_id]?.name||'',Organo:map[t.space_id]?.org_unit||'',Descripcion_Tarea:t.title,Responsable:t.assignee,Autor:t.created_by,Fecha_Limite:t.due_date,Fecha_Hora_Limite:t.due_datetime||'',Estado:t.stage||(t.done?'Completado':'Por hacer'),Texto_Origen:t.source_text||'',Tipo_Origen:t.source_type||'Texto'})),
 '4_Bitacora_Historica':data.notes.map(n=>({ID_Nota:n.id,Espacio_ID:n.space_id,Fecha_Hora:n.created_at,Autor_Equipo:n.author,Contacto_Espacio:map[n.space_id]?.name||'',Codigo_CUT:map[n.space_id]?.cut_code||'',Actualizacion_Registrada:n.content})),
 '5_Reuniones_Acuerdos':data.meetings.map(m=>({ID_Reunion:m.id,Espacio_ID:m.space_id,Fecha_Hora_Reunion:m.datetime,Titulo_Reunion:m.title,Contacto_Espacio:map[m.space_id]?.name||'',Codigo_CUT:map[m.space_id]?.cut_code||'',Participantes:m.participants,Enlace_Sala:m.link,Sala_Presencial:m.location||'',Estado_Reunion:m.status||'Programada',Acuerdos_Pactados:agreementLines(m).join('\n'),Autor:m.created_by}))
 };
}
