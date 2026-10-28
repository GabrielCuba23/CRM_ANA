export function peruDay(value){return new Date(value).toLocaleDateString('en-CA',{timeZone:'America/Lima'});}
export function taskDeadline(task){return task.due_datetime?Date.parse(task.due_datetime):task.due_date?Date.parse(task.due_date+'T17:00:00-05:00'):null;}
export function remindersFor(data,operator,now=Date.now()){
 if(!operator)return [];
 const spaces=new Map(data.spaces.map(s=>[s.id,s])),alerts=[];
 for(const m of data.meetings){
  const delta=Date.parse(m.datetime)-now;
  if((m.status||'Programada')==='Programada'&&delta>=0&&delta<=15*60000)alerts.push({id:'meeting:'+m.id+':'+m.datetime,kind:'Reunión en 15 minutos',title:m.title,space_id:m.space_id,at:m.datetime});
 }
 for(const t of data.tasks){
  const due=taskDeadline(t),s=spaces.get(t.space_id);
  if(t.done||due===null||t.assignee!==operator&&!s?.assignees.includes(operator))continue;
  const delta=due-now;
  if(delta<=3600000)alerts.push({id:'task:'+t.id+':'+(t.due_datetime||t.due_date),kind:delta<0?'Tarea vencida':'Tarea próxima a vencer',title:t.title,space_id:t.space_id,at:new Date(due).toISOString()});
 }
 return alerts.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
}
export function reportPeriod(mode,now=new Date()){
 const today=peruDay(now),[y,m,d]=today.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
 if(mode==='month')return {from:`${y}-${String(m).padStart(2,'0')}-01`,to:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)};
 if(mode==='week'){const weekday=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-weekday);const from=date.toISOString().slice(0,10);date.setUTCDate(date.getUTCDate()+6);return {from,to:date.toISOString().slice(0,10)};}
 return {from:'',to:''};
}
export function filterReport(data,{from='',to='',member=''}={}){
 const inPeriod=v=>{if(!from&&!to)return true;if(!v)return false;const day=String(v).length===10?v:peruDay(v);return (!from||day>=from)&&(!to||day<=to);};
 const chosen=new Set(data.spaces.filter(s=>!member||s.assignees.includes(member)).map(s=>s.id));
 if(member){for(const t of data.tasks)if(t.assignee===member)chosen.add(t.space_id);for(const n of data.notes)if(n.author===member)chosen.add(n.space_id);for(const m of data.meetings)if(m.created_by===member)chosen.add(m.space_id);}
 return {...data,spaces:data.spaces.filter(s=>chosen.has(s.id)),members:member?[member]:data.members,
 tasks:data.tasks.filter(t=>chosen.has(t.space_id)&&(!member||t.assignee===member)&&(!t.done||inPeriod(t.updated_at||t.created_at)||inPeriod(t.due_date))),
 notes:data.notes.filter(n=>chosen.has(n.space_id)&&(!member||n.author===member)&&inPeriod(n.created_at)),meetings:data.meetings.filter(m=>chosen.has(m.space_id)&&inPeriod(m.datetime))};
}
