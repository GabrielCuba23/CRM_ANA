# Código íntegro de los componentes principales · CRM ANA 1.1.0

Todos los archivos se muestran completos. El código ejecutable está en las rutas indicadas.

## src/main.jsx

```jsx
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
```

## src/App.jsx

```jsx
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
import {isExtension,request} from './api.js';
const empty={spaces:[],notes:[],tasks:[],meetings:[],templates:[],members:[],notifications:[],agreement_tasks:[]};
function storedId(key,storage){let id=storage.getItem(key);if(!id){id=crypto.randomUUID();storage.setItem(key,id);}return id;}
const device=storedId('ana.device',localStorage),pc=storedId('ana.tab',sessionStorage);
function initialSession(){const token=sessionStorage.getItem('ana.token'),base=isExtension?localStorage.getItem('ana.api'):location.origin;return token&&base?{token,base}:null;}
export default function App(){
 const [session,setSession]=useState(initialSession),[data,setData]=useState(empty),[loaded,setLoaded]=useState(false),[operator,setOperator]=useState(localStorage.getItem('ana.operator')||'');
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
 useEffect(()=>{if(loaded&&operator&&!data.members.includes(operator)){setOperator('');localStorage.removeItem('ana.operator');}},[loaded,data.members,operator]);
 useEffect(()=>{
  if(!isExtension)return;
  let active=true,key;
  chrome.windows.getCurrent().then(async window=>{key='activeWhatsAppChat:'+window.id;const v=await chrome.storage.local.get(key);if(active)setChat(v[key]);});
  const listener=(changes,area)=>{if(active&&key&&area==='local'&&changes[key])setChat(changes[key].newValue);};
  chrome.storage.onChanged.addListener(listener);return()=>{active=false;chrome.storage.onChanged.removeListener(listener);};
 },[]);
 useEffect(()=>{
  if(!loaded||!chat)return;
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
 function logout(){sessionStorage.removeItem('ana.token');setSession(null);setLoaded(false);setData(empty);setSelected('');setMessage(null);matched.current='';}
 if(!session)return <Login onLogin={login}/>;
 const filtered=filterSpaces(data,search,tray,operator).filter(s=>(!directoryUnit||s.org_unit===directoryUnit)&&(!directoryOwner||s.assignees.includes(directoryOwner))),pending=data.tasks.filter(t=>!t.done).length;
 function openSpace(id){setSelected(id);setView('Directorio');if(!data.spaces.some(s=>s.id===id))load();}
 const navigation=[['Directorio','users'],['Tareas','check'],['Agenda','calendar'],['Kanban','grid'],['Centro de datos','database']];
 return <div className={`app ${isExtension?'extension-mode':''} ${space&&view==='Directorio'?'has-selection':''}`}>
 <aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setView('Directorio');}}><AnaLogo/><span className="brand-caption">COORDINACIÓN INSTITUCIONAL</span></a><div className="workspace-label">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal">{navigation.map(([label,icon])=><button key={label} className={view===label?'active':''} onClick={()=>{setView(label);setSelected('');}}><Icon name={icon}/>{label}{label==='Directorio'&&<span>{data.spaces.length}</span>}</button>)}</nav><div className="sidebar-note"><span className="live-dot"/><strong>Una agenda, todo el equipo</strong><p>Coordina con trazabilidad, incluso fuera de la oficina.</p></div><footer><span>ANA · MIDAGRI</span><small>Coordinación institucional</small></footer></aside>
 <div className="workspace"><header className="topbar"><div className="compact-brand"><AnaLogo/><span>COORDINACIÓN<br/>INSTITUCIONAL</span></div><div className="breadcrumb">Agenda cloud <span>/</span> <strong>{view}</strong></div><div className="operator"><Icon name="users" size={17}/><label htmlFor="operator">¿Quién opera esta PC?</label><select id="operator" aria-label="¿Quién opera esta PC?" disabled={!loaded} value={operator} onChange={e=>{setOperator(e.target.value);localStorage.setItem('ana.operator',e.target.value);}}><option value="">Elegir operador</option>{data.members.map(m=><option key={m}>{m}</option>)}</select><button className="icon-btn notice-bell" aria-label={`Avisos internos (${unread} sin leer)`} title="Avisos internos y recordatorios" disabled={!operator} onClick={()=>setNoticesOpen(true)}><Icon name="bell" size={18}/>{unread>0&&<span className="unread-count">{unread>99?'99+':unread}</span>}</button><button className="icon-btn" aria-label="Agregar o administrar operadores" title="Agregar o administrar operadores" disabled={!operator||!loaded||busy} onClick={()=>setTeamOpen(true)}><Icon name="plus" size={17}/></button><button className="icon-btn" aria-label="Cerrar sesión" onClick={logout}><Icon name="logout" size={17}/></button></div></header>
 <nav className="mobile-nav" aria-label="Vistas">{navigation.map(([label,icon])=><button key={label} className={view===label?'active':''} onClick={()=>{setView(label);setSelected('');}}><Icon name={icon} size={17}/>{label}</button>)}</nav>
 <div className="sync-line"><span className={`live-dot ${online?'':'offline'}`}/>{online?'Sincronizado':'Sin conexión confirmada'}{lastSync&&<time> · {lastSync.toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit'})}</time>}<button onClick={load}>Actualizar</button>{!presenceOk&&space&&<span className="warning-text">Presencia sin actualizar: no se puede confirmar quién está viendo.</span>}</div>
 {!operator&&<div className="operator-prompt">Selecciona «¿Quién opera esta PC?» para registrar notas, tareas y acuerdos con tu nombre.</div>}
 {message&&<div role={message.error?'alert':'status'} className={`toast ${message.error?'error':'success'}`}><span>{message.text}</span><button className="icon-btn" aria-label="Cerrar aviso" onClick={()=>setMessage(null)}><Icon name="close" size={16}/></button></div>}
 {isExtension&&chat?.rawTitle&&<div className="chat-context"><small>CHAT DE WHATSAPP</small><strong>{chat.rawTitle}</strong>{matchChat(data.spaces,chat.rawTitle).length!==1&&<><p>No hay una coincidencia única. Elige un espacio del directorio o crea uno.</p><Button kind="secondary" disabled={!operator} onClick={()=>setSpaceForm({name:chat.rawTitle,phone_or_group_id:/^\+?[\d\s().-]{7,25}$/.test(chat.rawTitle)?chat.rawTitle:''})}>Crear espacio para este chat</Button></>}</div>}
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
 </div>;
}
```

## src/components/AnaLogo.jsx

```jsx
import React from 'react';
import anaLogo from '../assets/ana-logo.png';

export default function AnaLogo({className=''}) {
  return <img className={`ana-logo ${className}`} src={anaLogo}
    alt="ANA · Autoridad Nacional del Agua" width={929} height={412} decoding="async"/>;
}
```

## src/components/UI.jsx

```jsx
import React,{useRef,useEffect,useId} from 'react';
export function Icon({name,size=20}){
 const paths={bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',check:'M20 6L9 17l-5-5',plus:'M12 5v14 M5 12h14',arrow:'M5 12h14 M12 5l7 7-7 7',file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',database:'M21 5c0 2.2-4 4-9 4S3 7.2 3 5s4-4 9-4 9 1.8 9 4z M3 5v14c0 2.2 4 4 9 4s9-1.8 9-4V5 M3 12c0 2.2 4 4 9 4s9-1.8 9-4',calendar:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',copy:'M9 9h12v12H9z M5 15H3V3h12v2',close:'M6 6l12 12 M6 18L18 6',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',download:'M12 3v12 M6 9l6 6 6-6 M3 16v5h18v-5',logout:'M9 3H3v18h6 M9 12h12 M15 6l6 6-6 6'};
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]||paths.file}/></svg>;
}
export function Button({children,kind='primary',className='',...props}){return <button className={`btn ${kind} ${className}`} {...props}>{children}</button>;}
export function Field({label,children,...props}){const labelId=useId();return <label className="field"><span id={labelId}>{label}</span>{children?React.cloneElement(children,{'aria-labelledby':labelId}):<input {...props} aria-labelledby={labelId}/>}</label>;}
export function Form({onSave,children,className=''}){return <form className={className} onSubmit={async e=>{e.preventDefault();await onSave(new FormData(e.currentTarget),e.currentTarget);}}>{children}</form>;}
export function Modal({title,onClose,children}){
 const ref=useRef();useEffect(()=>{const el=ref.current;el.showModal();return()=>{el.close();};},[]);
 return <dialog ref={ref} className="modal" onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" aria-label="Cerrar diálogo" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;
}
export function Empty({title,children}){return <div className="empty"><Icon name="file" size={30}/><h3>{title}</h3><p>{children}</p></div>;}
export function Stamp({value}){return <time dateTime={value}>{new Date(value).toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'medium',timeStyle:'short'})}</time>;}
export function Badge({status}){return <span className={`badge status-${{'Urgente':'urgent','Pendiente':'pending','En elaboración':'working','Para V°B°':'review','Cerrado':'closed'}[status]}`}>{status}</span>;}
export function Avatar({name}){return <span className="avatar" aria-label={name}>{name?.split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase()||'A'}</span>;}
```

## src/components/Login.jsx

```jsx
import React,{useState} from 'react';
import {isExtension,apiOrigin,request} from '../api.js';
import {Button,Field,Icon} from './UI.jsx';
import AnaLogo from './AnaLogo.jsx';
export default function Login({onLogin}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function login(e){
  e.preventDefault();setBusy(true);setError('');
  const f=new FormData(e.currentTarget);
  try{
   const base=apiOrigin(isExtension?String(f.get('url')).trim():location.origin),token=String(f.get('token')).trim();
   if(isExtension){const granted=await chrome.permissions.request({origins:[`${base}/*`]});if(!granted)throw new Error('Autoriza a la extensión a consultar tu dominio de Cloudflare.');}
   const data=await request(base,token,'sync');
   localStorage.setItem('ana.api',base);sessionStorage.setItem('ana.token',token);onLogin({base,token,data});
  }catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <main className="login"><section className="login-card"><div className="login-brand"><AnaLogo/></div><p className="eyebrow">COORDINACIÓN INSTITUCIONAL · MIDAGRI</p><h1>El equipo conectado.<br/>La gestión, en orden.</h1><p>Agenda cloud, seguimiento de CUT y acuerdos en un solo lugar.</p><form onSubmit={login}>
 {isExtension&&<Field label="Dirección de tu aplicación Cloudflare Pages" type="url" name="url" required defaultValue={localStorage.getItem('ana.api')||''} autoComplete="url"/>}
 <Field label="Token de acceso del equipo" name="token" type="password" minLength={24} maxLength={1024} required autoComplete="current-password"/>
 {error&&<p className="error" role="alert">{error}</p>}<Button disabled={busy} type="submit">{busy?'Conectando':'Entrar al espacio de trabajo'}<Icon name="arrow"/></Button>
 </form><small>Acceso compartido del equipo. Elige tu operador después de ingresar.</small></section><aside className="login-aside"><span>AGENDA CLOUD</span><h2>Cada coordinación<br/>tiene su espacio.</h2><p>Del primer contacto al último acuerdo.</p><div className="water-lines"/></aside></main>;
}
```

## src/components/SpaceForm.jsx

```jsx
import React from 'react';
import {STATUSES,UNITS} from '../../shared/domain.js';
import {Button,Field,Form,Modal} from './UI.jsx';
export default function SpaceForm({initial,members,onSave,onClose,busy}){
 const s=initial||{};
 return <Modal title={s.id?'Editar espacio':'Nuevo espacio de contacto'} onClose={onClose}><Form className="form-grid" onSave={async f=>{
   const saved=await onSave({...s,id:s.id||crypto.randomUUID(),name:f.get('name'),phone_or_group_id:f.get('phone'),role:f.get('role'),email:f.get('email'),extension:f.get('extension'),office:f.get('office'),entity:f.get('entity'),location:f.get('location'),org_unit:f.get('unit'),status:f.get('status'),cut_code:f.get('cut'),doc_ref:f.get('doc'),assignees:f.getAll('assignees')});if(saved)onClose();
 }}>
 <Field label="Nombre del contacto o grupo" name="name" required maxLength={200} defaultValue={s.name||''}/>
 <Field label="Teléfono internacional o ID de grupo" name="phone" required maxLength={200} defaultValue={s.phone_or_group_id||''}/>
 <Field label="Cargo" name="role" maxLength={300} defaultValue={s.role||''}/>
 <Field label="Órgano / Unidad"><select name="unit" defaultValue={s.org_unit||'ALA'}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></Field>
 <Field label="Correo institucional" name="email" type="email" maxLength={254} defaultValue={s.email||''}/>
 <Field label="Anexo" name="extension" maxLength={50} defaultValue={s.extension||''}/>
 <Field label="Dirección / AAA / ALA / Oficina" name="office" maxLength={300} defaultValue={s.office||''}/>
 <Field label="Entidad (ANA, MIDAGRI, GORE, Junta de Usuarios u otra)" name="entity" maxLength={300} defaultValue={s.entity||''}/>
 <Field label="Ubicación / dirección" name="location" maxLength={500} defaultValue={s.location||''}/>
 <Field label="Estado de gestión"><select name="status" defaultValue={s.status||'Pendiente'}>{STATUSES.map(u=><option key={u}>{u}</option>)}</select></Field>
 <Field label="Código CUT" name="cut" maxLength={100} defaultValue={s.cut_code||''}/>
 <Field label="Documento de referencia" name="doc" maxLength={500} defaultValue={s.doc_ref||''}/>
 <fieldset className="full"><legend>Responsables asignados</legend><div className="check-group">{members.map(m=><label key={m}><input type="checkbox" name="assignees" value={m} defaultChecked={s.assignees?.includes(m)}/>{m}</label>)}</div></fieldset>
 <footer className="form-actions full"><Button type="button" kind="secondary" onClick={onClose}>Cancelar</Button><Button disabled={busy}>Guardar espacio</Button></footer>
 </Form></Modal>;
}
```

## src/components/SpaceDetail.jsx

```jsx
import React,{useState} from 'react';
import {signedText,minuteText} from '../../shared/domain.js';
import {clipboard} from '../api.js';
import TaskEditor from './TaskEditor.jsx';
import MeetingEditor from './MeetingEditor.jsx';
import {Button,Field,Form,Icon,Empty,Stamp,Badge,Avatar} from './UI.jsx';
export default function SpaceDetail({space,data,operator,act,busy,onEdit,onClose,presence,device,notify,onNotify}){
 const [tab,setTab]=useState('Bitácora'),[signature,setSignature]=useState(localStorage.getItem('ana.signature')!=='false');
 const [compose,setCompose]=useState(''),[command,setCommand]=useState(''),[editingMeeting,setEditingMeeting]=useState(null),[editingTemplate,setEditingTemplate]=useState(null);
 const notes=data.notes.filter(n=>n.space_id===space.id),tasks=data.tasks.filter(t=>t.space_id===space.id),meetings=data.meetings.filter(t=>t.space_id===space.id);
 const others=[...new Set(presence.filter(p=>p.device_id!==device).map(p=>p.operator_name))];
 const pending=tasks.filter(t=>!t.done).length;
 async function copy(text){try{await clipboard(text);notify('Texto copiado');return true;}catch{notify('El navegador no permitió copiar. Selecciona el texto y cópialo manualmente.',true);return false;}}
 async function composeAction(share=false){
  const text=signedText(compose,operator,signature);if(!text)return;
  if(share){
   const phone=/^\d{7,15}$/.test(space.phone_or_group_id)?space.phone_or_group_id:'';
   window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer');
  }else if(!await copy(text))return;
  await act('ADD_NOTE',{id:crypto.randomUUID(),space_id:space.id,content:`[${share?'Borrador abierto en WhatsApp':'Texto copiado'}]\n${text}`});
 }
 return <article className="detail"><header className="detail-head"><div className="detail-heading"><Avatar name={space.name}/><div><p className="eyebrow">ESPACIO DE CONTACTO · {space.org_unit}</p><h2>{space.name}</h2><p>{space.role||'Coordinación institucional'}</p></div><button className="icon-btn close-detail" aria-label="Cerrar espacio" onClick={onClose}><Icon name="close"/></button></div>
 <div className="detail-meta"><Badge status={space.status}/><span>{space.phone_or_group_id}</span>{/^\d{7,15}$/.test(space.phone_or_group_id)&&<a className="btn quiet" href={`https://wa.me/${space.phone_or_group_id}`} target="_blank" rel="noopener noreferrer">Abrir chat ↗</a>}<Button kind="quiet" onClick={onEdit}>Editar</Button></div>
 <div className="reference"><span>CUT<strong>{space.cut_code||'Sin CUT'}</strong></span><span>DOCUMENTO<strong>{space.doc_ref||'Sin documento'}</strong></span></div>
 <div className="contact-extras">{space.office&&<p>{space.office}</p>}{space.entity&&<p>{space.entity}</p>}{space.email&&<a href={'mailto:'+space.email}>{space.email}</a>}{space.extension&&<p>Anexo: {space.extension}</p>}{space.location&&<p>{space.location}</p>}</div>
 <Button kind="secondary" disabled={!operator||data.members.length<2} onClick={onNotify}>Avisar a otro operador</Button>
 <p className="assignees"><Icon name="users" size={15}/>{space.assignees.join(', ')||'Sin responsables asignados'}</p></header>
 {others.length>0&&<div className="collision" role="status">⚠️ {others.join(', ')} también tiene abierto este espacio en otra PC</div>}
 <nav className="detail-tabs" aria-label="Herramientas del espacio">{['Bitácora','Tareas','Reuniones','Formatos /'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}{t==='Tareas'&&pending>0&&<span>{pending}</span>}</button>)}</nav>
 <section className="detail-body">
 {tab==='Bitácora'&&<><div className="section-title"><h3>Bitácora interna</h3><small>{notes.length} registros</small></div><Form className="note-form" onSave={async(f,form)=>{if(await act('ADD_NOTE',{id:crypto.randomUUID(),space_id:space.id,content:f.get('content')}))form.reset();}}><label className="sr-only" htmlFor="note-content">Nueva nota</label><textarea id="note-content" name="content" required maxLength={20000} rows={3} placeholder="Registra una actualización para el equipo"/><div><small>Firma: {operator||'elige un operador'}</small><Button disabled={busy||!operator}>Registrar nota <Icon name="arrow" size={16}/></Button></div></Form>
 <div className="timeline">{notes.length?notes.map(n=><article className="note" key={n.id}><Avatar name={n.author}/><div><header><strong>{n.author}</strong><Stamp value={n.created_at}/></header><p>{n.content}</p></div></article>):<Empty title="Una historia por empezar">Registra la primera coordinación de este contacto.</Empty>}</div></>}
 {tab==='Tareas'&&<><div className="section-title"><h3>Tareas y checklist</h3><small>{tasks.length-pending}/{tasks.length} completadas</small></div><TaskEditor data={data} spaceId={space.id} operator={operator} busy={busy} onSave={p=>act('UPSERT_TASK',p)}/>
 {tasks.map(t=><article className={`task ${t.done?'done':''}`} key={t.id}><input type="checkbox" aria-label={`Completar ${t.title}`} checked={t.done} disabled={busy||!operator} onChange={()=>act('UPSERT_TASK',{...t,done:!t.done,stage:t.done?'Por hacer':'Completado'})}/><div><strong>{t.title}</strong><p>{t.stage} · {t.assignee} {t.due_date&&`· ${t.due_date}`}</p><small>Creó: {t.created_by} · Última gestión: {t.updated_by}</small></div><button className="icon-btn" aria-label={`Eliminar tarea ${t.title}`} disabled={busy||!operator} onClick={()=>{if(confirm('¿Eliminar esta tarea?'))act('DELETE_TASK',{id:t.id});}}><Icon name="close" size={16}/></button></article>)}{!tasks.length&&<Empty title="Checklist despejado">Agrega la primera tarea con responsable y fecha.</Empty>}</>}
 {tab==='Reuniones'&&<><div className="section-title"><h3>Reuniones y minutas</h3><small>Hora de Perú</small></div><MeetingEditor key={editingMeeting?.id||'new'} spaceId={space.id} initial={editingMeeting} members={data.members} operator={operator} busy={busy} locked={!!editingMeeting&&(data.agreement_tasks||[]).some(a=>a.meeting_id===editingMeeting.id)} onCancel={()=>setEditingMeeting(null)} onSave={async p=>{const ok=await act('ADD_MEETING',p);if(ok)setEditingMeeting(null);return ok;}}/>
 {meetings.map(m=><article className="meeting" key={m.id}><Stamp value={m.datetime}/><h4>{m.title}</h4><p>{m.status} · {m.participants}</p>{m.location&&<p>{m.location}</p>}{m.link&&<a href={m.link} target="_blank" rel="noopener noreferrer">Abrir sala ↗</a>}<p className="pre-line">{m.agreements}</p>{m.agreement_items?.map((a,i)=><p key={i}>{i+1}. {a.text} · {a.assignee} · {a.due_date}</p>)}<small>Registró: {m.created_by} · Última gestión: {m.updated_by}</small><div className="row wrap"><Button kind="secondary" onClick={()=>{setCompose(minuteText(m,space));setTab('Formatos /');}}>Generar minuta</Button>{m.agreement_items?.length>0&&<Button kind="secondary" disabled={busy||!operator||(data.agreement_tasks||[]).filter(a=>a.meeting_id===m.id).length===m.agreement_items.length} onClick={()=>act('CREATE_AGREEMENT_TASKS',{id:m.id})}>Crear tareas de acuerdos</Button>}<Button kind="quiet" onClick={()=>setEditingMeeting(m)}>Editar</Button><Button kind="quiet" disabled={busy} onClick={()=>{if(confirm('¿Eliminar reunión?'))act('DELETE_MEETING',{id:m.id});}}>Eliminar</Button></div></article>)}{!meetings.length&&<Empty title="Próxima reunión">Agenda un encuentro y registra sus acuerdos.</Empty>}</>}
 {tab==='Formatos /'&&<><div className="section-title"><h3>Formatos y enlaces</h3><small>Compartidos en la nube</small></div><Field label="Buscar comando rápido"><input value={command} onChange={e=>setCommand(e.target.value)} placeholder="/drive, /tdr, /cut"/></Field><div className="templates">{data.templates.filter(t=>`${t.command} ${t.title}`.toLowerCase().includes(command.toLowerCase())).map(t=><article key={t.id}><button className="template-use" onClick={()=>{setCompose(t.content);setCommand('');}}><code>{t.command}</code><strong>{t.title}</strong></button><button className="icon-btn" aria-label={`Editar ${t.command}`} onClick={()=>setEditingTemplate(t)}><Icon name="settings" size={16}/></button><button className="icon-btn" aria-label={`Eliminar ${t.command}`} onClick={()=>{if(confirm('¿Eliminar formato compartido?'))act('DELETE_TEMPLATE',{id:t.id});}}><Icon name="close" size={16}/></button></article>)}</div>
 <Field label="Texto preparado / minuta"><textarea value={compose} maxLength={20000} rows={6} onChange={e=>setCompose(e.target.value)}/></Field><label className="switch"><input type="checkbox" checked={signature} onChange={e=>{setSignature(e.target.checked);localStorage.setItem('ana.signature',String(e.target.checked));}}/>Firma automática: *{operator||'Operador'} - Coord. ANA*</label><div className="row wrap"><Button disabled={!compose.trim()||!operator||busy} onClick={()=>composeAction()}><Icon name="copy" size={16}/>Copiar</Button><Button disabled={!compose.trim()||!operator||busy} kind="secondary" onClick={()=>composeAction(true)}>Abrir borrador en WhatsApp ↗</Button></div><small>No se envían mensajes automáticamente. La bitácora registra la preparación, no la entrega.</small>
 <details className="template-editor" open={!!editingTemplate}><summary>Crear o editar formato compartido</summary><Form key={editingTemplate?.id||'new'} className="stack card-form" onSave={async(f,form)=>{if(await act('UPSERT_TEMPLATE',{id:editingTemplate?.id||crypto.randomUUID(),command:f.get('command'),title:f.get('title'),content:f.get('content')})){setEditingTemplate(null);form.reset();}}}><Field label="Comando" name="command" required pattern="/[a-zA-Z0-9_\-]+" maxLength={40} defaultValue={editingTemplate?.command||''}/><Field label="Título" name="title" required maxLength={200} defaultValue={editingTemplate?.title||''}/><Field label="Texto o enlace"><textarea name="content" rows={3} required maxLength={20000} defaultValue={editingTemplate?.content||''}/></Field><div className="row"><Button disabled={busy||!operator}>Guardar formato</Button>{editingTemplate&&<Button type="button" kind="quiet" onClick={()=>setEditingTemplate(null)}>Cancelar edición</Button>}</div></Form></details></>}
 </section>
 </article>;
}
```

## src/components/TaskEditor.jsx

```jsx
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
```

## src/components/TaskBoard.jsx

```jsx
import React,{useState} from 'react';
import {TASK_STAGES,folded} from '../../shared/domain.js';
import {Button,Field,Icon,Modal,Empty} from './UI.jsx';
import TaskEditor from './TaskEditor.jsx';
export default function TaskBoard({data,operator,busy,act,onOpenSpace}){
 const [assignee,setAssignee]=useState(''),[query,setQuery]=useState(''),[editing,setEditing]=useState(null);
 const map=Object.fromEntries(data.spaces.map(s=>[s.id,s]));
 const tasks=data.tasks.filter(t=>(!assignee||t.assignee===assignee)&&folded([t.title,t.source_text,map[t.space_id]?.name,map[t.space_id]?.cut_code].join(' ')).includes(folded(query)));
 return <section className="main-content"><header className="page-heading"><div><p className="eyebrow">PENDIENTES Y ENTREGABLES DEL EQUIPO</p><h1>Tablero de tareas</h1><p>Cuatro estados, responsables y vencimientos compartidos.</p></div><Button disabled={!operator||!data.spaces.length} onClick={()=>setEditing({})}><Icon name="plus"/>Nueva tarea</Button></header>
 <div className="task-filters"><Field label="Filtrar por responsable"><select value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">Todo el equipo</option>{data.members.map(m=><option key={m}>{m}</option>)}</select></Field><Field label="Buscar tareas"><input value={query} onChange={e=>setQuery(e.target.value)}/></Field><Button kind="secondary" onClick={()=>setAssignee(operator)} disabled={!operator}>Mis tareas</Button></div>
 <div className="task-board">{TASK_STAGES.map(stage=><section className="task-column" key={stage}><header><h2>{stage}</h2><span>{tasks.filter(t=>t.stage===stage).length}</span></header>{tasks.filter(t=>t.stage===stage).map(t=><article key={t.id} className="task-board-card"><button className="contact-link" onClick={()=>onOpenSpace(t.space_id)}>{map[t.space_id]?.name} · {map[t.space_id]?.cut_code||'Sin CUT'}</button><h3>{t.title}</h3><p>{t.assignee}</p><small className={!t.done&&t.due_date&&t.due_date<new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'})?'overdue':''}>{t.due_date||'Sin fecha límite'}</small>{t.source_text&&<details><summary>Origen: {t.source_type}</summary><p className="pre-line">{t.source_text}</p></details>}<Field label={`Estado de tarea ${t.title}`}><select value={t.stage} disabled={busy||!operator} onChange={e=>act('UPSERT_TASK',{...t,stage:e.target.value,done:e.target.value==='Completado'})}>{TASK_STAGES.map(s=><option key={s}>{s}</option>)}</select></Field><Button kind="quiet" disabled={!operator} onClick={()=>setEditing(t)}>Editar tarea</Button></article>)}</section>)}</div>
 {!data.spaces.length&&<Empty title="Primero crea un espacio de contacto">Las tareas quedan vinculadas al contacto y su CUT.</Empty>}
 {editing&&<Modal title={editing.id?'Editar tarea':'Crear tarea desde mensaje o texto'} onClose={()=>setEditing(null)}><TaskEditor data={data} operator={operator} initial={editing.id?editing:null} busy={busy} onSave={async p=>{const ok=await act('UPSERT_TASK',p);if(ok)setEditing(null);return ok;}}/></Modal>}
 </section>;
}
```

## src/components/MeetingEditor.jsx

```jsx
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
```

## src/components/CalendarView.jsx

```jsx
import React,{useState} from 'react';
import {peruDay} from '../../shared/planning.js';
import {Button,Field,Stamp,Empty} from './UI.jsx';
export default function CalendarView({data,onOpenSpace}){
 const [month,setMonth]=useState(peruDay(Date.now()).slice(0,7)),[day,setDay]=useState(''),[query,setQuery]=useState('');
 const [year,mo]=month.split('-').map(Number),days=new Date(Date.UTC(year,mo,0)).getUTCDate(),offset=(new Date(Date.UTC(year,mo-1,1)).getUTCDay()+6)%7;
 const map=Object.fromEntries(data.spaces.map(s=>[s.id,s]));
 const events=data.meetings.filter(m=>peruDay(m.datetime).startsWith(month)&&(!day||peruDay(m.datetime)===day)&&`${m.title} ${m.participants} ${map[m.space_id]?.name||''} ${map[m.space_id]?.cut_code||''}`.toLowerCase().includes(query.toLowerCase()));
 function move(delta){setMonth(new Date(Date.UTC(year,mo-1+delta,1)).toISOString().slice(0,7));setDay('');}
 return <section className="main-content"><header className="page-heading"><div><p className="eyebrow">AGENDA COMPARTIDA · HORA DE PERÚ</p><h1>Calendario de reuniones</h1><p>Programa y edita cada reunión desde el espacio de su contacto.</p></div></header><div className="calendar-controls"><Button kind="secondary" onClick={()=>move(-1)}>← Anterior</Button><strong>{new Date(Date.UTC(year,mo-1,15)).toLocaleDateString('es-PE',{month:'long',year:'numeric',timeZone:'America/Lima'})}</strong><Button kind="secondary" onClick={()=>move(1)}>Siguiente →</Button></div><div className="calendar-grid">{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=><strong key={d} className="calendar-weekday">{d}</strong>)}{Array.from({length:offset},(_,i)=><div key={'empty'+i}/>)}{Array.from({length:days},(_,i)=>{const key=month+'-'+String(i+1).padStart(2,'0'),count=data.meetings.filter(m=>peruDay(m.datetime)===key&&m.status!=='Cancelada').length;return <button key={key} className={`calendar-day ${key===day?'active':''} ${key===peruDay(Date.now())?'today':''}`} onClick={()=>setDay(day===key?'':key)} aria-label={`${key}, ${count} reuniones`}><span>{i+1}</span>{count>0&&<small>{count} reunión{count>1?'es':''}</small>}</button>;})}</div><div className="calendar-filter"><Field label="Buscar reunión, contacto o CUT"><input value={query} onChange={e=>setQuery(e.target.value)}/></Field>{day&&<Button kind="quiet" onClick={()=>setDay('')}>Mostrar todo el mes</Button>}</div><div className="agenda-list">{events.map(m=><article key={m.id}><Stamp value={m.datetime}/><span className="meeting-state">{m.status||'Programada'}</span><h3>{m.title}</h3><p>{m.participants}</p><p>{m.location||'Sala virtual'} {m.link&&<a href={m.link} target="_blank" rel="noreferrer">Abrir sala ↗</a>}</p><Button kind="secondary" onClick={()=>onOpenSpace(m.space_id)}>Abrir {map[m.space_id]?.name||'contacto'}</Button></article>)}</div>{!events.length&&<Empty title="Sin reuniones en esta selección">Elige otro día o agenda una reunión desde un contacto.</Empty>}</section>;
}
```

## src/components/NotificationCenter.jsx

```jsx
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
```

## src/components/DataCenter.jsx

```jsx
import React,{useState} from 'react';
import {request,downloadJson,clipboard} from '../api.js';
import {validateBackup} from '../../server/validation.js';
import {filterReport,reportPeriod} from '../../shared/planning.js';
import {Button,Icon,Field,Modal} from './UI.jsx';
export default function DataCenter({data,session,operator,notify,onReload}){
 const [pending,setPending]=useState(null),[busy,setBusy]=useState(false),[showUrl,setShowUrl]=useState(false),[confirmText,setConfirmText]=useState('');
 const [period,setPeriod]=useState('all'),[range,setRange]=useState({from:'',to:''}),[reportMember,setReportMember]=useState('');
 const invalidPeriod=!!(range.from&&range.to&&range.from>range.to);
 const reportData=filterReport(data,{...range,member:reportMember});
 const powerUrl=`${session.base}/api/powerbi?token=${encodeURIComponent(session.token)}`;
 async function exportBackup(){const backup=await request(session.base,session.token,'backup');downloadJson(backup,`Entrega_Cargo_ANA_${new Date().toISOString().slice(0,10)}.json`);}
 async function perform(fn){setBusy(true);try{await fn();}catch(e){notify(e.message,true);}finally{setBusy(false);}}
 async function readFile(e){
  const file=e.target.files[0];e.target.value='';if(!file)return;
  await perform(async()=>{if(file.size>1400000)throw new Error('La copia supera el límite de 1,4 MB para restauración interactiva. Usa el respaldo nativo D1 para volúmenes mayores.');const parsed=JSON.parse(await file.text());validateBackup(parsed);setPending(parsed);setConfirmText('');});
 }
 return <section className="data-center"><header className="page-heading"><div><p className="eyebrow">INFORMACIÓN QUE TRASCIENDE</p><h1>Centro de datos</h1><p>Reportes, análisis y continuidad del equipo.</p></div><Icon name="database" size={36}/></header>
 <p className="audit-link"><a href="./docs/revision-15-funciones.html" target="_blank" rel="noreferrer">Ver revisión punto por punto de las 15 funciones acordadas ↗</a></p>
 <div className="report-filters"><Field label="Período del reporte"><select value={period} onChange={e=>{setPeriod(e.target.value);setRange(reportPeriod(e.target.value));}}><option value="all">Todo el historial</option><option value="week">Esta semana</option><option value="month">Este mes</option><option value="custom">Personalizado</option></select></Field><Field label="Desde"><input type="date" value={range.from} onChange={e=>{setPeriod('custom');setRange({...range,from:e.target.value});}}/></Field><Field label="Hasta"><input type="date" value={range.to} onChange={e=>{setPeriod('custom');setRange({...range,to:e.target.value});}}/></Field><Field label="Integrante del reporte"><select value={reportMember} onChange={e=>setReportMember(e.target.value)}><option value="">Todo el equipo</option>{[...new Set([...data.members,...data.tasks.map(t=>t.assignee),...data.notes.map(n=>n.author)])].map(m=><option key={m}>{m}</option>)}</select></Field></div><small>Se conservan las tareas pendientes aunque se hayan creado antes del período. Los filtros afectan los reportes Excel y PDF; el respaldo JSON sigue siendo completo.</small>
 {invalidPeriod&&<p className="error" role="alert">La fecha inicial del reporte debe ser anterior o igual a la fecha final.</p>}
 <div className="data-cards"><article className="data-card"><span className="data-icon"><Icon name="file" size={26}/></span><h2>Reporte maestro Excel</h2><p>Un libro real con cinco hojas: KPIs, agenda, tareas, bitácora y reuniones. Incluye responsables y códigos CUT.</p><div className="data-stat">{data.spaces.length}<small>espacios de contacto</small></div><Button disabled={busy||invalidPeriod} onClick={()=>perform(async()=>{const {downloadMasterExcel}=await import('../utils/excelExport.js');downloadMasterExcel(reportData);notify('Excel generado con 5 hojas');})}><Icon name="download"/>Descargar .xlsx</Button><Button kind="secondary" disabled={busy||invalidPeriod} onClick={()=>perform(async()=>{const {downloadReportPdf}=await import('../utils/pdfExport.js');downloadReportPdf(reportData,{...range,member:reportMember});})}>Descargar reporte PDF</Button></article>
 <article className="data-card"><span className="data-icon"><Icon name="grid" size={26}/></span><h2>Conector y proyecto Power BI</h2><p>En Power BI Desktop, selecciona «Obtener datos → Web». Conecta las cinco tablas del reporte.</p><Button kind="secondary" onClick={()=>setShowUrl(!showUrl)}>{showUrl?'Ocultar URL privada':'Mostrar URL privada'}</Button>{showUrl&&<Field label="URL con acceso de equipo (confidencial)"><textarea readOnly rows={4} value={powerUrl}/></Field>}<Button kind="quiet" onClick={()=>perform(async()=>{await clipboard(powerUrl);notify('URL privada copiada');})}><Icon name="copy" size={16}/>Copiar conexión</Button><a className="btn secondary" href="./powerbi/CRM_ANA_PowerBI.pbip.zip" download>Descargar proyecto Power BI .pbip</a><small>Ábrelo en Power BI Desktop de Windows, configura la URL y el token en los parámetros y guárdalo como .pbix si lo necesitas. La conexión se actualiza al refrescar datos.</small><small>La URL contiene el token maestro. Compártela solo con operadores autorizados; el historial y Power BI pueden conservarla.</small></article>
 <article className="data-card"><span className="data-icon"><Icon name="users" size={26}/></span><h2>Entrega de cargo</h2><p>Copia completa versionada: espacios, tareas, notas, reuniones, formatos, operadores y avisos internos. No incluye tokens ni sesiones temporales.</p><Button disabled={busy} onClick={()=>perform(exportBackup)}><Icon name="download"/>Descargar respaldo .json</Button><label className={`btn secondary upload ${busy||!operator?'disabled':''}`}>Restaurar desde .json<input aria-label="Restaurar copia JSON" type="file" accept=".json,application/json" disabled={busy||!operator} onChange={readFile}/></label><small>Antes de restaurar se descarga otra copia del estado actual. Para más de 1,4 MB, usa exportación/importación nativa de D1.</small></article></div>
 {pending&&<Modal title="Restaurar entrega de cargo" onClose={()=>{if(!busy)setPending(null);}}><div className="stack"><p>Se reemplazarán todos los datos actuales por esta copia: {pending.data.spaces.length} espacios, {pending.data.notes.length} notas, {pending.data.tasks.length} tareas y {pending.data.meetings.length} reuniones y {(pending.data.notifications||[]).length} avisos internos.</p><p>Solicita al equipo cerrar los espacios durante la restauración. La operación es atómica; antes se descargará un respaldo del estado actual.</p><Field label="Escribe RESTAURAR para confirmar"><input value={confirmText} onChange={e=>setConfirmText(e.target.value)} autoComplete="off"/></Field><Button kind="danger" disabled={busy||confirmText!=='RESTAURAR'} onClick={()=>perform(async()=>{
 await exportBackup();await request(session.base,session.token,'backup',{confirm:'RESTAURAR',operator_name:operator,backup:pending});setPending(null);await onReload();notify('Copia restaurada correctamente');
 })}>{busy?'Restaurando':'Restaurar base completa'}</Button></div></Modal>}
 </section>;
}
```

## src/utils/excelExport.js

```javascript
import {createMasterWorkbook,createMasterExcelBytes} from './nativeExcel.js';
export {createMasterWorkbook,createMasterExcelBytes};
export function downloadMasterExcel(data){
 const bytes=createMasterExcelBytes(data),url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const a=document.createElement('a');a.href=url;a.download=`Reporte_Maestro_CRM_ANA_${new Date().toISOString().slice(0,10)}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
```

## src/utils/nativeExcel.js

```javascript
import * as XLSX from 'xlsx';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {reportTables} from '../../shared/domain.js';
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
const PKG='http://schemas.openxmlformats.org/package/2006/relationships';
const XML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const headers=[
 ['Integrante_Equipo','Espacios_Asignados','Coordinaciones_Urgentes','Para_Visto_Bueno','Tareas_Pendientes','Tareas_Completadas','Porcentaje_Avance'],
 ['ID_Espacio','Nombre_Contacto_o_Grupo','Cargo','Organo_Unidad','Oficina','Entidad','Correo','Anexo','Ubicacion','Telefono_WhatsApp','Codigo_CUT','Documento_Referencia','Estado_Gestion','Responsables_Equipo','Ultima_Actualizacion'],
 ['ID_Tarea','Espacio_ID','Codigo_CUT','Contacto_Espacio','Organo','Descripcion_Tarea','Responsable','Autor','Fecha_Limite','Fecha_Hora_Limite','Estado','Texto_Origen','Tipo_Origen'],
 ['ID_Nota','Espacio_ID','Fecha_Hora','Autor_Equipo','Contacto_Espacio','Codigo_CUT','Actualizacion_Registrada'],
 ['ID_Reunion','Espacio_ID','Fecha_Hora_Reunion','Titulo_Reunion','Contacto_Espacio','Codigo_CUT','Participantes','Enlace_Sala','Sala_Presencial','Estado_Reunion','Acuerdos_Pactados','Autor']
];
const tableNames=['Resumen_KPIs','Agenda_Espacios','Tareas_y_CUTs','Bitacora_Historica','Reuniones_Acuerdos'];
const esc=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const col=XLSX.utils.encode_col;
function addPart(files,path,xml){files[path]=strToU8(xml);}
function appendXml(files,path,tag,content){const xml=strFromU8(files[path]);files[path]=strToU8(xml.replace('</'+tag+'>',content+'</'+tag+'>'));}
function relationship(files,path,id,type,target){if(!files[path])addPart(files,path,XML+`<Relationships xmlns="${PKG}"></Relationships>`);appendXml(files,path,'Relationships',`<Relationship Id="${id}" Type="${REL+type}" Target="${target}"/>`);}
function contentType(files,path,type){appendXml(files,'[Content_Types].xml','Types',`<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.${type}+xml"/>`);}
function pivotPlan(rows,fields,rowKey,columnKey,idKey,name,title,row){
 const rowLabels=[...new Set(rows.map(r=>String(r[rowKey]??'')))],columnLabels=[...new Set(rows.map(r=>String(r[columnKey]??'')))];
 const matrix=[[title],[rowKey,...columnLabels,'Total general']];
 for(const label of rowLabels){const selected=rows.filter(r=>String(r[rowKey]??'')===label);matrix.push([label,...columnLabels.map(c=>selected.filter(r=>String(r[columnKey]??'')===c).length),selected.length]);}
 matrix.push(['Total general',...columnLabels.map(c=>rows.filter(r=>String(r[columnKey]??'')===c).length),rows.length]);
 return {rows,fields,rowKey,columnKey,idKey,name,title,row,rowLabels,columnLabels,matrix,ref:`A${row+2}:${col(columnLabels.length+1)}${row+matrix.length}`};
}
export function createMasterWorkbook(data){
 const tables=reportTables(data),wb=XLSX.utils.book_new();
 Object.entries(tables).forEach(([name,rows],i)=>{
  const sheet=XLSX.utils.json_to_sheet(rows,{header:headers[i]});
  sheet['!cols']=headers[i].map(key=>({wch:Math.min(55,Math.max(18,key.length+3))}));
  sheet['!autofilter']={ref:`A1:${col(headers[i].length-1)}${Math.max(2,rows.length+1)}`};
  XLSX.utils.book_append_sheet(wb,sheet,name);
 });return wb;
}
export function createMasterExcelBytes(data){
 const tables=Object.values(reportTables(data)),wb=createMasterWorkbook(data);let row=tables[0].length+5;
 const plans=[
  [tables[2],headers[2],'Responsable','Estado','ID_Tarea','CargaTareasOperador','TAREAS POR OPERADOR Y ESTADO',2],
  [tables[1],headers[1],'Organo_Unidad','Estado_Gestion','ID_Espacio','CoordinacionesOrgano','COORDINACIONES POR ÓRGANO Y ESTADO',1],
  [tables[4],headers[4],'Contacto_Espacio','Estado_Reunion','ID_Reunion','ReunionesContacto','REUNIONES POR CONTACTO Y ESTADO',4]
 ].map(args=>{const source=args.pop(),plan=pivotPlan(...args,row);row+=plan.matrix.length+4;plan.source=source;XLSX.utils.sheet_add_aoa(wb.Sheets[wb.SheetNames[0]],plan.matrix,{origin:{r:plan.row,c:0}});return plan;});
 const files=unzipSync(new Uint8Array(XLSX.write(wb,{type:'array',bookType:'xlsx'})));
 // Tablas estructuradas: se pueden importar por nombre en Power Query.
 tables.forEach((rows,i)=>{
  const ref=`A1:${col(headers[i].length-1)}${Math.max(2,rows.length+1)}`,path=`xl/tables/table${i+1}.xml`,rid='rIdDataTable';
  addPart(files,path,XML+`<table xmlns="${NS}" id="${i+1}" name="${tableNames[i]}" displayName="${tableNames[i]}" ref="${ref}" totalsRowShown="0"><autoFilter ref="${ref}"/><tableColumns count="${headers[i].length}">${headers[i].map((h,j)=>`<tableColumn id="${j+1}" name="${esc(h)}"/>`).join('')}</tableColumns><tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`);
  contentType(files,path,'table');relationship(files,`xl/worksheets/_rels/sheet${i+1}.xml.rels`,rid,'table',`../tables/table${i+1}.xml`);
  appendXml(files,`xl/worksheets/sheet${i+1}.xml`,'worksheet',`<tableParts count="1"><tablePart r:id="${rid}"/></tableParts>`);
 });
 let cacheRefs='',pivotRefs='';
 plans.forEach((p,index)=>{
  const n=index+1,cacheId=index,shared=p.fields.map(key=>[...new Set(p.rows.map(r=>String(r[key]??'')))]),ri=p.fields.indexOf(p.rowKey),ci=p.fields.indexOf(p.columnKey),di=p.fields.indexOf(p.idKey);
  const cachePath=`xl/pivotCache/pivotCacheDefinition${n}.xml`,recordPath=`xl/pivotCache/pivotCacheRecords${n}.xml`,pivotPath=`xl/pivotTables/pivotTable${n}.xml`;
  const sourceRef=`A1:${col(p.fields.length-1)}${Math.max(2,p.rows.length+1)}`;
  addPart(files,cachePath,XML+`<pivotCacheDefinition xmlns="${NS}" xmlns:r="${REL.slice(0,-1)}" r:id="rIdRecords" recordCount="${p.rows.length}" saveData="1" refreshOnLoad="1" enableRefresh="1" createdVersion="6" refreshedVersion="6" minRefreshableVersion="3"><cacheSource type="worksheet"><worksheetSource ref="${sourceRef}" sheet="${esc(wb.SheetNames[p.source])}"/></cacheSource><cacheFields count="${p.fields.length}">${p.fields.map((field,i)=>`<cacheField name="${esc(field)}" numFmtId="0"><sharedItems count="${shared[i].length}" containsString="1" containsNumber="0" containsSemiMixedTypes="0">${shared[i].map(s=>`<s v="${esc(s)}"/>`).join('')}</sharedItems></cacheField>`).join('')}</cacheFields></pivotCacheDefinition>`);
  addPart(files,recordPath,XML+`<pivotCacheRecords xmlns="${NS}" count="${p.rows.length}">${p.rows.map(row=>`<r>${p.fields.map((field,i)=>`<x v="${shared[i].indexOf(String(row[field]??''))}"/>`).join('')}</r>`).join('')}</pivotCacheRecords>`);
  const fields=p.fields.map((_,i)=>{
   if(i===ri||i===ci){const values=i===ri?p.rowLabels:p.columnLabels;return `<pivotField axis="${i===ri?'axisRow':'axisCol'}" showAll="0" defaultSubtotal="0"><items count="${values.length+1}">${values.map(v=>`<item x="${shared[i].indexOf(v)}"/>`).join('')}<item t="default"/></items></pivotField>`;}
   return `<pivotField ${i===di?'dataField="1" ':''}showAll="0"/>`;
  }).join('');
  const rowItems=p.rowLabels.map((_,i)=>`<i><x v="${i}"/></i>`).join('')+'<i t="grand"><x/></i>';
  const colItems=p.columnLabels.map((_,i)=>`<i><x v="${i}"/></i>`).join('')+'<i t="grand"><x/></i>';
  addPart(files,pivotPath,XML+`<pivotTableDefinition xmlns="${NS}" name="${p.name}" cacheId="${cacheId}" dataCaption="Cantidad" grandTotalCaption="Total general" updatedVersion="6" minRefreshableVersion="3" createdVersion="6" rowGrandTotals="1" colGrandTotals="1" compact="0" compactData="0" outline="0" gridDropZones="1" multipleFieldFilters="0"><location ref="${p.ref}" firstHeaderRow="0" firstDataRow="1" firstDataCol="1"/><pivotFields count="${p.fields.length}">${fields}</pivotFields><rowFields count="1"><field x="${ri}"/></rowFields><rowItems count="${p.rowLabels.length+1}">${rowItems}</rowItems><colFields count="1"><field x="${ci}"/></colFields><colItems count="${p.columnLabels.length+1}">${colItems}</colItems><dataFields count="1"><dataField name="Cantidad" fld="${di}" subtotal="count" baseField="0" baseItem="0"/></dataFields><pivotTableStyleInfo name="PivotStyleMedium9" showRowHeaders="1" showColHeaders="1" showRowStripes="1" showColStripes="0" showLastColumn="1"/></pivotTableDefinition>`);
  contentType(files,cachePath,'pivotCacheDefinition');contentType(files,recordPath,'pivotCacheRecords');contentType(files,pivotPath,'pivotTable');
  relationship(files,`xl/pivotCache/_rels/pivotCacheDefinition${n}.xml.rels`,'rIdRecords','pivotCacheRecords',`pivotCacheRecords${n}.xml`);
  relationship(files,`xl/pivotTables/_rels/pivotTable${n}.xml.rels`,'rIdCache','pivotCacheDefinition',`../pivotCache/pivotCacheDefinition${n}.xml`);
  relationship(files,'xl/_rels/workbook.xml.rels','rIdAnaCache'+n,'pivotCacheDefinition',`pivotCache/pivotCacheDefinition${n}.xml`);
  relationship(files,'xl/worksheets/_rels/sheet1.xml.rels','rIdAnaPivot'+n,'pivotTable',`../pivotTables/pivotTable${n}.xml`);
  cacheRefs+=`<pivotCache cacheId="${cacheId}" r:id="rIdAnaCache${n}"/>`;pivotRefs+=`<pivotTablePart r:id="rIdAnaPivot${n}"/>`;
 });
 appendXml(files,'xl/workbook.xml','workbook',`<pivotCaches>${cacheRefs}</pivotCaches>`);
 appendXml(files,'xl/worksheets/sheet1.xml','worksheet',`<pivotTableParts count="${plans.length}">${pivotRefs}</pivotTableParts>`);
 return zipSync(files,{level:6});
}
```

## src/utils/pdfExport.js

```javascript
import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {reportTables} from '../../shared/domain.js';
export function createReportPdf(data,{from='',to='',member=''}={}){
 const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
 const tables=reportTables(data);let first=true;
 for(const [name,rows] of Object.entries(tables)){
  if(!first)pdf.addPage();first=false;
  pdf.setFont('helvetica','bold');pdf.setFontSize(16);pdf.setTextColor(41,87,164);pdf.text('ANA · Seguimiento de coordinaciones',14,16);
  pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(70);pdf.text(`${name} | ${from||'Inicio'} a ${to||'Actualidad'} | ${member||'Todo el equipo'}`,14,24);
  if(!rows.length){pdf.text('Sin registros para esta selección.',14,36);continue;}
  const keys=Object.keys(rows[0]);
  autoTable(pdf,{startY:30,head:[keys.map(k=>k.replaceAll('_',' '))],body:rows.map(row=>keys.map(k=>String(row[k]??''))),styles:{font:'helvetica',fontSize:6,cellPadding:2,overflow:'linebreak'},headStyles:{fillColor:[41,87,164]},alternateRowStyles:{fillColor:[243,246,252]},margin:{left:10,right:10}});
 }
 const pages=pdf.getNumberOfPages();for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(90);pdf.text(`Coordinación institucional · Página ${i} de ${pages}`,14,202);}
 return pdf;
}
export function downloadReportPdf(data,options){createReportPdf(data,options).save('Reporte_CRM_ANA_'+new Date().toISOString().slice(0,10)+'.pdf');}
```
