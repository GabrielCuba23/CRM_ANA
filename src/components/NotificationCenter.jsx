import React,{useCallback,useEffect,useRef,useState} from 'react';
import {request} from '../api.js';
import {remindersFor} from '../../shared/planning.js';
import {Button,Field,Form,Modal,Stamp,Empty} from './UI.jsx';

function storedDismissals(operator){try{return JSON.parse(localStorage.getItem('ana.reminders.'+operator)||'[]');}catch{return [];}}
export default function NotificationCenter({session,operator,data,act,busy,open,onClose,composeFor,onComposeClose,onUnread,onOpenSpace}){
 const [inbox,setInbox]=useState({received:[],sent:[],unread:0}),[tab,setTab]=useState('Recibidos'),[error,setError]=useState('');
 const [latest,setLatest]=useState(null),[reminders,setReminders]=useState([]),[dismissed,setDismissed]=useState([]);
 const known=useRef(new Set()),requesting=useRef(false),activeOperator=useRef(operator);
 const [noticeId,setNoticeId]=useState(()=>crypto.randomUUID());
 useEffect(()=>{if(composeFor)setNoticeId(crypto.randomUUID());},[composeFor]);
 const refresh=useCallback(async()=>{
  if(!operator||requesting.current)return;requesting.current=true;
  try{
   const result=await request(session.base,session.token,'notices?operator='+encodeURIComponent(operator));
   if(activeOperator.current!==operator)return;
   setInbox(result);onUnread(result.unread);setError('');
   const fresh=result.received.find(n=>!n.read_at&&!known.current.has(n.id));
   result.received.forEach(n=>known.current.add(n.id));if(fresh)setLatest(fresh);
  }catch(e){if(activeOperator.current===operator)setError(e.message);}finally{requesting.current=false;}
 },[session,operator,onUnread]);
 useEffect(()=>{
  activeOperator.current=operator;known.current=new Set();requesting.current=false;setInbox({received:[],sent:[],unread:0});onUnread(0);setLatest(null);setError('');setDismissed(storedDismissals(operator));
  if(!operator)return;refresh();const timer=setInterval(refresh,5000);return()=>{clearInterval(timer);activeOperator.current=null;};
 },[operator,refresh,onUnread]);
 useEffect(()=>{const check=()=>setReminders(remindersFor(data,operator));check();const timer=setInterval(check,30000);return()=>clearInterval(timer);},[data,operator]);
 const visible=reminders.filter(r=>!dismissed.includes(r.id));
 function dismiss(id){const next=[...dismissed,id].slice(-500);setDismissed(next);localStorage.setItem('ana.reminders.'+operator,JSON.stringify(next));}
 async function acknowledge(action,n){if(await act(action,{id:n.id})){if(latest?.id===n.id)setLatest(null);await refresh();}}
 return <>
 {latest&&!open&&<aside className="notice-popup" role="status"><strong>{latest.sender} te envió un aviso</strong><p>{latest.content}</p><div className="row"><Button kind="secondary" onClick={()=>{setTab('Recibidos');onClose(false);}}>Ver avisos</Button><Button kind="quiet" onClick={()=>setLatest(null)}>Cerrar</Button></div></aside>}
 {visible.length>0&&!open&&<aside className="reminder-banner" role="status"><strong>{visible[0].kind}: {visible[0].title}</strong><Button kind="quiet" onClick={()=>{setTab('Recordatorios');onClose(false);}}>Ver {visible.length} recordatorio{visible.length>1?'s':''}</Button></aside>}
 {open&&<Modal title="Avisos y recordatorios" onClose={()=>onClose(true)}><div className="notification-dialog"><nav className="inbox-tabs">{['Recibidos','Enviados','Recordatorios'].map(t=><button className={tab===t?'active':''} key={t} onClick={()=>setTab(t)}>{t}{t==='Recibidos'&&inbox.unread>0?' ('+inbox.unread+')':''}</button>)}</nav><p className="muted">Operador activo: {operator}. Los avisos se guardan aunque el destinatario esté desconectado. Se muestran hasta 100 avisos por bandeja.</p>{error&&<p className="error" role="alert">Avisos sin actualizar: {error}</p>}
 {tab==='Recordatorios'?<><small>Reuniones: 15 minutos antes. Tareas: una hora antes y vencidas; sin hora explícita, el vencimiento se considera a las 17:00 de Perú. Funciona mientras el CRM esté abierto.</small>{visible.map(r=><article className="inbox-item" key={r.id}><strong>{r.kind}</strong><h3>{r.title}</h3><Stamp value={r.at}/><div className="row wrap"><Button kind="secondary" onClick={()=>{onOpenSpace(r.space_id);onClose(true);}}>Abrir contacto</Button><Button kind="quiet" onClick={()=>dismiss(r.id)}>Descartar recordatorio</Button></div></article>)}{!visible.length&&<Empty title="Sin recordatorios pendientes">Tus reuniones y tareas aparecerán aquí al acercarse su plazo.</Empty>}</>:<>{(tab==='Recibidos'?inbox.received:inbox.sent).map(n=><article className={`inbox-item ${!n.read_at?'unread':''}`} key={n.id}><header><strong>{tab==='Recibidos'?'De '+n.sender:'Para '+n.recipient}</strong><Stamp value={n.created_at}/></header><small>{n.contact_name}{n.cut_code?' · '+n.cut_code:''}</small><p>{n.content}</p><small>{n.acknowledged_at?'Recibido y confirmado':n.read_at?'Leído':'Pendiente de lectura'}</small><div className="row wrap">{n.space_id&&<Button kind="secondary" onClick={()=>{onOpenSpace(n.space_id);onClose(true);}}>Abrir espacio</Button>}{tab==='Recibidos'&&!n.read_at&&<Button kind="quiet" disabled={busy} onClick={()=>acknowledge('READ_NOTICE',n)}>Marcar leído</Button>}{tab==='Recibidos'&&!n.acknowledged_at&&<Button disabled={busy} onClick={()=>acknowledge('ACK_NOTICE',n)}>Recibido</Button>}</div></article>)}{!(tab==='Recibidos'?inbox.received:inbox.sent).length&&<Empty title="Sin avisos en esta bandeja">Envía un aviso desde el espacio de un contacto.</Empty>}</>}
 </div></Modal>}
 {composeFor&&<Modal title="Avisar a otro operador" onClose={onComposeClose}><p className="muted">Contacto: {composeFor.name}. El aviso llega al CRM del compañero; se registra también en la bitácora.</p><Form className="stack card-form" onSave={async f=>{const ok=await act('SEND_NOTICE',{id:noticeId,space_id:composeFor.id,recipient:f.get('recipient'),content:f.get('content')});if(ok){onComposeClose();setTab('Enviados');onClose(false);await refresh();}}}><Field label="Operador destinatario"><select name="recipient" required defaultValue=""><option value="">Selecciona a quién avisar</option>{data.members.filter(m=>m!==operator).map(m=><option key={m}>{m}</option>)}</select></Field><Field label="Mensaje del aviso"><textarea name="content" required rows={4} maxLength={3000} defaultValue={`${composeFor.name} desea comunicarse contigo. Por favor revisa este contacto.`}/></Field><small>Se enviará como {operator}. El destinatario podrá confirmar «Recibido».</small><Button disabled={busy||!operator}>Enviar aviso interno</Button></Form></Modal>}
 </>;
}
