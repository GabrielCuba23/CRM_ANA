import {localStore,sessionStore} from './storage.js';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import Login from './components/Login.jsx';
import AnaLogo from './components/AnaLogo.jsx';
import SpaceForm from './components/SpaceForm.jsx';
import SpaceDetail from './components/SpaceDetail.jsx';
import TaskBoard from './components/TaskBoard.jsx';
import CalendarView from './components/CalendarView.jsx';
import NotificationCenter from './components/NotificationCenter.jsx';
import DataCenter from './components/DataCenter.jsx';
import {Avatar,Badge,Button,Empty,Field,Form,Icon,Modal} from './components/UI.jsx';
import {filterSpaces,matchChat,STATUSES,UNITS} from '../shared/domain.js';
import {request} from './api.js';
import {isPanel,panelBridge} from './panelBridge.js';
import VersionNotice from './components/VersionNotice.jsx';
const empty={spaces:[],notes:[],tasks:[],meetings:[],templates:[],members:[],notifications:[],agreement_tasks:[]};
function storedId(key,storage){let id=storage.getItem(key);if(!id){id=crypto.randomUUID();storage.setItem(key,id);}return id;}
const device=storedId('ana.device',localStore),pc=storedId('ana.tab',sessionStore);
function initialSession(){const token=sessionStore.getItem('ana.token'),base=location.origin;return token?{token,base}:null;}
export default function App(){
 const [session,setSession]=useState(initialSession),[data,setData]=useState(empty),[loaded,setLoaded]=useState(false),[operator,setOperator]=useState(localStore.getItem('ana.operator')||'');
 const [directoryUnit,setDirectoryUnit]=useState(''),[directoryOwner,setDirectoryOwner]=useState('');
 const [view,setView]=useState('Directorio'),[search,setSearch]=useState(''),[tray,setTray]=useState('Todos'),[selected,setSelected]=useState('');
 const [noticesOpen,setNoticesOpen]=useState(false),[noticeDraft,setNoticeDraft]=useState(null),[unread,setUnread]=useState(0);
 const [spaceForm,setSpaceForm]=useState(null),[teamOpen,setTeamOpen]=useState(false),[busy,setBusy]=useState(false),[presence,setPresence]=useState([]),[chat,setChat]=useState(null);
 const [message,setMessage]=useState(null),[online,setOnline]=useState(false),[presenceOk,setPresenceOk]=useState(true),[lastSync,setLastSync]=useState(null);
 const matched=useRef(''),mutation=useRef(false),loadGeneration=useRef(0),syncInFlight=useRef(false),syncAbort=useRef(null);
 const notify=useCallback((text,error=false)=>setMessage({text,error,scope:'action'}),[]);
 const load=useCallback(async()=>{
  if(!session)return;
  const generation=++loadGeneration.current;
  syncAbort.current?.abort();
  const controller=new AbortController();syncAbort.current=controller;syncInFlight.current=true;
  try{
   const state=await request(session.base,session.token,'sync',undefined,{signal:controller.signal});
   if(generation===loadGeneration.current){
    setData(state);setLoaded(true);setOnline(true);setLastSync(new Date());
    setMessage(previous=>previous?.scope==='sync'?null:previous);
   }
  }catch(e){
   if(!controller.signal.aborted&&generation===loadGeneration.current){setOnline(false);setMessage(previous=>previous?.scope==='action'&&previous.error?previous:{text:e.message,error:true,scope:'sync'});}
  }finally{if(generation===loadGeneration.current)syncInFlight.current=false;}
 },[session]);
 useEffect(()=>{
  if(!session)return;load();
  const timer=setInterval(()=>{if(!mutation.current&&!syncInFlight.current)load();},12000);
  return()=>{clearInterval(timer);loadGeneration.current++;syncAbort.current?.abort();syncAbort.current=null;syncInFlight.current=false;};
 },[session,load]);
 useEffect(()=>{if(loaded&&operator&&!data.members.includes(operator)){setOperator('');localStore.removeItem('ana.operator');}},[loaded,data.members,operator]);
 useEffect(()=>{
  if(!isPanel)return;
  return panelBridge.subscribe(value=>{setChat(value);setOperator(localStore.getItem('ana.operator')||'');});
 },[]);
 useEffect(()=>{
  if(!loaded)return;
  if(!chat?.rawTitle){if(matched.current){matched.current='';setSelected('');}return;}
  const key=`${chat.tabId}:${chat.rawTitle}`;if(matched.current===key)return;matched.current=key;
  const matches=matchChat(data.spaces,chat.rawTitle);setSelected(matches.length===1?matches[0].id:'');setView('Directorio');
 },[chat,data.spaces,loaded]);
 const space=data.spaces.find(s=>s.id===selected);
 useEffect(()=>{
  setPresence([]);if(!session||!space||!operator)return;
  let alive=true,inflight=false;
  async function beat(){if(inflight)return;inflight=true;try{
   const r=await request(session.base,session.token,'presence',{pc_id:pc,device_id:device,space_id:space.id,operator_name:operator});
   if(alive){setPresence(r.presence);setPresenceOk(true);}
  }catch{if(alive)setPresenceOk(false);}finally{inflight=false;}}
  beat();const timer=setInterval(beat,4000);return()=>{alive=false;clearInterval(timer);request(session.base,session.token,'presence',{pc_id:pc,device_id:device,operator_name:operator,space_id:space.id,leave:true}).catch(()=>{});};
 },[session,space?.id,operator]);
 async function act(action,payload){
  if(!operator){notify('Elige quién opera esta PC antes de registrar cambios.',true);return false;}
  if(mutation.current)return false;
  mutation.current=true;setBusy(true);loadGeneration.current++;syncAbort.current?.abort();syncInFlight.current=false;
  try{await request(session.base,session.token,'sync',{action,payload,operator_name:operator});await load();return true;}
  catch(e){notify(e.message,true);return false;}finally{mutation.current=false;setBusy(false);}
 }
 function login(value){setSession({base:value.base,token:value.token});setData(value.data);setLoaded(true);setOnline(true);setLastSync(new Date());}
 function logout(){sessionStore.removeItem('ana.token');setSession(null);setLoaded(false);setData(empty);setSelected('');setMessage(null);matched.current='';}
 if(!session)return <><VersionNotice/>{!sessionStore.persistent&&<div className="storage-notice" role="status">El navegador limita el almacenamiento de este panel. Puedes trabajar durante esta sesión; al recargar tendrás que ingresar el token de nuevo. También puedes abrir el CRM en una pestaña.</div>}<Login onLogin={login}/></>;
 const filtered=filterSpaces(data,search,tray,operator).filter(s=>(!directoryUnit||s.org_unit===directoryUnit)&&(!directoryOwner||s.assignees.includes(directoryOwner))),pending=data.tasks.filter(t=>!t.done).length;
 function openSpace(id){setSelected(id);setView('Directorio');if(!data.spaces.some(s=>s.id===id))load();}
 const navigation=[['Directorio','users'],['Tareas','check'],['Agenda','calendar'],['Kanban','grid'],['Centro de datos','database']];
 return <><VersionNotice/><div className={`app ${isPanel?'extension-mode':''} ${space&&view==='Directorio'?'has-selection':''}`}>
 <aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setView('Directorio');}}><AnaLogo/><span className="brand-caption">COORDINACIÓN INSTITUCIONAL</span></a><div className="workspace-label">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal">{navigation.map(([label,icon])=><button key={label} className={view===label?'active':''} onClick={()=>{setView(label);setSelected('');}}><Icon name={icon}/>{label}{label==='Directorio'&&<span>{data.spaces.length}</span>}</button>)}</nav><div className="sidebar-note"><span className="live-dot"/><strong>Una agenda, todo el equipo</strong><p>Coordina con trazabilidad, incluso fuera de la oficina.</p></div><footer><span>ANA · MIDAGRI</span><small>Coordinación institucional</small></footer></aside>
 <div className="workspace"><header className="topbar"><div className="compact-brand"><AnaLogo/><span>COORDINACIÓN<br/>INSTITUCIONAL</span></div><div className="breadcrumb">Agenda cloud <span>/</span> <strong>{view}</strong></div><div className="operator"><Icon name="users" size={17}/><label htmlFor="operator">¿Quién opera esta PC?</label><select id="operator" aria-label="¿Quién opera esta PC?" disabled={!loaded} value={operator} onChange={e=>{setOperator(e.target.value);localStore.setItem('ana.operator',e.target.value);panelBridge?.savePreferences({operator:e.target.value});}}><option value="">Elegir operador</option>{data.members.map(m=><option key={m}>{m}</option>)}</select><button className="icon-btn notice-bell" aria-label={`Avisos internos (${unread} sin leer)`} title="Avisos internos y recordatorios" disabled={!operator} onClick={()=>setNoticesOpen(true)}><Icon name="bell" size={18}/>{unread>0&&<span className="unread-count">{unread>99?'99+':unread}</span>}</button><button className="icon-btn" aria-label="Agregar o administrar operadores" title="Agregar o administrar operadores" disabled={!operator||!loaded||busy} onClick={()=>setTeamOpen(true)}><Icon name="plus" size={17}/></button><button className="icon-btn" aria-label="Cerrar sesión" onClick={logout}><Icon name="logout" size={17}/></button></div></header>
 <nav className="mobile-nav" aria-label="Vistas">{navigation.map(([label,icon])=><button key={label} className={view===label?'active':''} onClick={()=>{setView(label);setSelected('');}}><Icon name={icon} size={17}/>{label}</button>)}</nav>
 <div className="sync-line"><span className={`live-dot ${online?'':'offline'}`}/>{online?'Sincronizado':'Sin conexión confirmada'}{lastSync&&<time> · {lastSync.toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit'})}</time>}<button onClick={load}>Actualizar</button>{!presenceOk&&space&&<span className="warning-text">Presencia sin actualizar: no se puede confirmar quién está viendo.</span>}</div>
 {!operator&&<div className="operator-prompt">Selecciona «¿Quién opera esta PC?» para registrar notas, tareas y acuerdos con tu nombre.</div>}
 {message&&<div role={message.error?'alert':'status'} className={`toast ${message.error?'error':'success'}`}><span>{message.text}</span><button className="icon-btn" aria-label="Cerrar aviso" onClick={()=>setMessage(null)}><Icon name="close" size={16}/></button></div>}
 {isPanel&&chat?.rawTitle&&<div className="chat-context"><small>CHAT DE WHATSAPP</small><strong>{chat.rawTitle}</strong>{matchChat(data.spaces,chat.rawTitle).length!==1&&<><p>No hay una coincidencia única. Elige un espacio del directorio o crea uno.</p><Button kind="secondary" disabled={!operator} onClick={()=>setSpaceForm({name:chat.rawTitle,phone_or_group_id:/^\+?[\d\s().-]{7,25}$/.test(chat.rawTitle)?chat.rawTitle:''})}>Crear espacio para este chat</Button></>}</div>}
 {view==='Tareas'?<TaskBoard data={data} operator={operator} busy={busy} act={act} onOpenSpace={openSpace}/>:view==='Agenda'?<CalendarView data={data} onOpenSpace={openSpace}/>:view==='Centro de datos'?<DataCenter data={data} session={session} operator={operator} notify={notify} onReload={load}/>:<main className="main-content"><header className="page-heading"><div><p className="eyebrow">CONTACTOS QUE CONECTAN. GESTIONES QUE AVANZAN.</p><h1>{view==='Kanban'?'Tablero de coordinación':'Directorio de espacios'}</h1><p>El contexto de cada contacto, al alcance de todo el equipo.</p></div><Button disabled={!operator||busy} onClick={()=>setSpaceForm({})}><Icon name="plus" size={18}/>Nuevo espacio</Button></header>
 <div className="kpis"><div><span>Espacios activos</span><strong>{data.spaces.filter(s=>s.status!=='Cerrado').length}</strong><small>Agenda compartida</small></div><div><span>Coordinaciones urgentes</span><strong className="urgent-text">{data.spaces.filter(s=>s.status==='Urgente').length}</strong><small>Requieren atención</small></div><div><span>Tareas por completar</span><strong>{pending}</strong><small>En todo el equipo</small></div><div><span>Para visto bueno</span><strong>{data.spaces.filter(s=>s.status==='Para V°B°').length}</strong><small>Pendientes de revisión</small></div></div>
 <div className="toolbar"><div className="search"><Icon name="search" size={19}/><input aria-label="Buscador global" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar contacto, CUT, teléfono, nota o tarea"/>{search&&<button aria-label="Limpiar búsqueda" onClick={()=>setSearch('')}>×</button>}</div><span>{filtered.length} espacios</span></div>
 <div className="directory-filters"><Field label="Filtrar directorio por órgano"><select value={directoryUnit} onChange={e=>setDirectoryUnit(e.target.value)}><option value="">Todos los órganos</option>{UNITS.map(u=><option key={u}>{u}</option>)}</select></Field><Field label="Filtrar directorio por operador"><select value={directoryOwner} onChange={e=>setDirectoryOwner(e.target.value)}><option value="">Todos los responsables</option>{data.members.map(m=><option key={m}>{m}</option>)}</select></Field></div>
 <nav className="trays" aria-label="Bandejas">{['Todos',...STATUSES,'Mis Coordinaciones'].map(t=><button key={t} className={tray===t?'active':''} onClick={()=>setTray(t)}>{t==='Urgente'?'Urgentes':t==='Pendiente'?'Pendientes':t}</button>)}</nav>
 {view==='Kanban'?<div className="kanban">{STATUSES.map(status=><section className="kanban-column" key={status}><header><Badge status={status}/><span>{filtered.filter(s=>s.status===status).length}</span></header>{filtered.filter(s=>s.status===status).map(s=><article className="kanban-card" key={s.id}><button onClick={()=>{setSelected(s.id);setView('Directorio');}}><small>{s.org_unit} · {s.cut_code||'Sin CUT'}</small><h3>{s.name}</h3><p>{s.doc_ref||s.role}</p><span>{s.assignees.join(', ')||'Sin responsable'}</span></button><label className="sr-only" htmlFor={`status-${s.id}`}>Estado de {s.name}</label><select id={`status-${s.id}`} value={s.status} disabled={busy||!operator} onChange={e=>act('UPSERT_SPACE',{...s,status:e.target.value})}>{STATUSES.map(t=><option key={t}>{t}</option>)}</select></article>)}</section>)}</div>:<div className={`directory-layout ${space?'split':''}`}><section className="directory"><div className="list-head"><span>CONTACTO / COORDINACIÓN</span><span>ESTADO</span></div>{filtered.map(s=><button key={s.id} className={`space-card ${selected===s.id?'selected':''}`} onClick={()=>setSelected(s.id)}><Avatar name={s.name}/><div className="space-info"><div><small>{s.org_unit}</small>{s.cut_code&&<code>{s.cut_code}</code>}</div><h3>{s.name}</h3><p>{s.role||s.phone_or_group_id}</p><footer><Icon name="users" size={13}/><span>{s.assignees.join(', ')||'Por asignar'}</span><span className="task-count">{data.tasks.filter(t=>t.space_id===s.id&&!t.done).length} tareas</span></footer></div><div className="space-right"><Badge status={s.status}/><Icon name="arrow" size={17}/></div></button>)}{loaded&&!filtered.length&&<Empty title={search?'No encontramos coincidencias':'Tu agenda empieza aquí'}>{search?'Prueba otro nombre, CUT o texto.':'Crea un espacio de contacto para organizar la primera coordinación.'}</Empty>}{!loaded&&<p className="loading" role="status">Cargando la agenda del equipo</p>}</section>
 {space&&<SpaceDetail key={space.id} space={space} data={data} operator={operator} busy={busy} act={act} onEdit={()=>setSpaceForm(space)} onClose={()=>setSelected('')} presence={presence} device={device} notify={notify} onNotify={()=>setNoticeDraft(space)}/>}
 </div>}
 </main>}
 <footer className="workspace-footer"><span>Coordinación ANA · Agenda Cloud</span><span>Fechas de gestión en hora de Perú (UTC−5)</span></footer>
 </div>
 <NotificationCenter session={session} operator={operator} data={data} act={act} busy={busy} open={noticesOpen} onClose={closing=>setNoticesOpen(!closing)} composeFor={noticeDraft} onComposeClose={()=>setNoticeDraft(null)} onUnread={setUnread} onOpenSpace={openSpace}/>
 {spaceForm&&<SpaceForm initial={spaceForm} members={data.members} busy={busy} onSave={p=>act('UPSERT_SPACE',p)} onClose={()=>setSpaceForm(null)}/>}
 {teamOpen&&<Modal title="Operadores del equipo" onClose={()=>setTeamOpen(false)}><p className="muted">Los cambios se comparten con todas las PC. Reasigna primero los espacios y tareas pendientes antes de eliminar un operador.</p><div className="team-list">{data.members.map(m=><div key={m}><Avatar name={m}/><strong>{m}</strong><Button kind="quiet" disabled={busy||data.members.length<2} onClick={()=>{if(confirm(`¿Eliminar a ${m} del equipo?`))act('UPDATE_MEMBERS',{members:data.members.filter(x=>x!==m)});}}>Eliminar</Button></div>)}</div><Form className="row" onSave={async(f,form)=>{if(await act('UPDATE_MEMBERS',{members:[...data.members,String(f.get('member')).trim()]}))form.reset();}}><Field label="Nombre del nuevo operador" name="member" required maxLength={80}/><Button disabled={busy}>Crear operador</Button></Form></Modal>}
 </div></>;
}
