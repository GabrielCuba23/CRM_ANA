# Código íntegro de los componentes React principales

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
import SpaceForm from './components/SpaceForm.jsx';
import SpaceDetail from './components/SpaceDetail.jsx';
import DataCenter from './components/DataCenter.jsx';
import {Avatar,Badge,Button,Empty,Field,Form,Icon,Modal} from './components/UI.jsx';
import {filterSpaces,matchChat,STATUSES} from '../shared/domain.js';
import {isExtension,request} from './api.js';
const empty={spaces:[],notes:[],tasks:[],meetings:[],templates:[],members:[]};
function storedId(key,storage){let id=storage.getItem(key);if(!id){id=crypto.randomUUID();storage.setItem(key,id);}return id;}
const device=storedId('ana.device',localStorage),pc=storedId('ana.tab',sessionStorage);
function initialSession(){const token=sessionStorage.getItem('ana.token'),base=isExtension?localStorage.getItem('ana.api'):location.origin;return token&&base?{token,base}:null;}
export default function App(){
 const [session,setSession]=useState(initialSession),[data,setData]=useState(empty),[loaded,setLoaded]=useState(false),[operator,setOperator]=useState(localStorage.getItem('ana.operator')||'');
 const [view,setView]=useState('Directorio'),[search,setSearch]=useState(''),[tray,setTray]=useState('Todos'),[selected,setSelected]=useState('');
 const [spaceForm,setSpaceForm]=useState(null),[teamOpen,setTeamOpen]=useState(false),[busy,setBusy]=useState(false),[presence,setPresence]=useState([]),[chat,setChat]=useState(null);
 const [message,setMessage]=useState(null),[online,setOnline]=useState(false),[presenceOk,setPresenceOk]=useState(true),[lastSync,setLastSync]=useState(null);
 const matched=useRef(''),mutation=useRef(false),loadGeneration=useRef(0);
 const notify=useCallback((text,error=false)=>setMessage({text,error}),[]);
 const load=useCallback(async()=>{
  if(!session)return;
  const generation=++loadGeneration.current;
  try{const state=await request(session.base,session.token,'sync');if(generation===loadGeneration.current){setData(state);setLoaded(true);setOnline(true);setLastSync(new Date());}}
  catch(e){setOnline(false);notify(e.message,true);}
 },[session,notify]);
 useEffect(()=>{if(!session)return;load();const timer=setInterval(()=>{if(!mutation.current)load();},12000);return()=>{clearInterval(timer);loadGeneration.current++;};},[session,load]);
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
  mutation.current=true;setBusy(true);loadGeneration.current++;
  try{await request(session.base,session.token,'sync',{action,payload,operator_name:operator});await load();return true;}
  catch(e){notify(e.message,true);return false;}finally{mutation.current=false;setBusy(false);}
 }
 function login(value){setSession({base:value.base,token:value.token});setData(value.data);setLoaded(true);setOnline(true);setLastSync(new Date());}
 function logout(){sessionStorage.removeItem('ana.token');setSession(null);setLoaded(false);setData(empty);setSelected('');setMessage(null);matched.current='';}
 if(!session)return <Login onLogin={login}/>;
 const filtered=filterSpaces(data,search,tray,operator),pending=data.tasks.filter(t=>!t.done).length;
 const navigation=[['Directorio','users'],['Kanban','grid'],['Centro de datos','database']];
 return <div className={`app ${isExtension?'extension-mode':''} ${space&&view==='Directorio'?'has-selection':''}`}>
 <aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setView('Directorio');}}><span className="brand-logo">ana</span><span>COORDINACIÓN<br/><b>INSTITUCIONAL</b></span></a><div className="workspace-label">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal">{navigation.map(([label,icon])=><button key={label} className={view===label?'active':''} onClick={()=>{setView(label);setSelected('');}}><Icon name={icon}/>{label}{label==='Directorio'&&<span>{data.spaces.length}</span>}</button>)}</nav><div className="sidebar-note"><span className="live-dot"/><strong>Una agenda, todo el equipo</strong><p>Coordina con trazabilidad, incluso fuera de la oficina.</p></div><footer><span>ANA · MIDAGRI</span><small>Coordinación institucional</small></footer></aside>
 <div className="workspace"><header className="topbar"><div className="breadcrumb">Agenda cloud <span>/</span> <strong>{view}</strong></div><div className="operator"><Icon name="users" size={17}/><label htmlFor="operator">¿Quién opera esta PC?</label><select id="operator" aria-label="¿Quién opera esta PC?" value={operator} onChange={e=>{setOperator(e.target.value);localStorage.setItem('ana.operator',e.target.value);}}><option value="">Elegir operador</option>{data.members.map(m=><option key={m}>{m}</option>)}</select><button className="icon-btn" aria-label="Administrar integrantes" disabled={!operator} onClick={()=>setTeamOpen(true)}><Icon name="settings" size={17}/></button><button className="icon-btn" aria-label="Cerrar sesión" onClick={logout}><Icon name="logout" size={17}/></button></div></header>
 <nav className="mobile-nav" aria-label="Vistas">{navigation.map(([label,icon])=><button key={label} className={view===label?'active':''} onClick={()=>{setView(label);setSelected('');}}><Icon name={icon} size={17}/>{label}</button>)}</nav>
 <div className="sync-line"><span className={`live-dot ${online?'':'offline'}`}/>{online?'Sincronizado':'Sin conexión confirmada'}{lastSync&&<time> · {lastSync.toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit'})}</time>}<button onClick={load}>Actualizar</button>{!presenceOk&&space&&<span className="warning-text">Presencia sin actualizar: no se puede confirmar quién está viendo.</span>}</div>
 {!operator&&<div className="operator-prompt">Selecciona «¿Quién opera esta PC?» para registrar notas, tareas y acuerdos con tu nombre.</div>}
 {message&&<div role={message.error?'alert':'status'} className={`toast ${message.error?'error':'success'}`}><span>{message.text}</span><button className="icon-btn" aria-label="Cerrar aviso" onClick={()=>setMessage(null)}><Icon name="close" size={16}/></button></div>}
 {isExtension&&chat?.rawTitle&&<div className="chat-context"><small>CHAT DE WHATSAPP</small><strong>{chat.rawTitle}</strong>{matchChat(data.spaces,chat.rawTitle).length!==1&&<><p>No hay una coincidencia única. Elige un espacio del directorio o crea uno.</p><Button kind="secondary" disabled={!operator} onClick={()=>setSpaceForm({name:chat.rawTitle,phone_or_group_id:/^\+?[\d\s().-]{7,25}$/.test(chat.rawTitle)?chat.rawTitle:''})}>Crear espacio para este chat</Button></>}</div>}
 {view==='Centro de datos'?<DataCenter data={data} session={session} operator={operator} notify={notify} onReload={load}/>:<main className="main-content"><header className="page-heading"><div><p className="eyebrow">CONTACTOS QUE CONECTAN. GESTIONES QUE AVANZAN.</p><h1>{view==='Kanban'?'Tablero de coordinación':'Directorio de espacios'}</h1><p>El contexto de cada contacto, al alcance de todo el equipo.</p></div><Button disabled={!operator||busy} onClick={()=>setSpaceForm({})}><Icon name="plus" size={18}/>Nuevo espacio</Button></header>
 <div className="kpis"><div><span>Espacios activos</span><strong>{data.spaces.filter(s=>s.status!=='Cerrado').length}</strong><small>Agenda compartida</small></div><div><span>Coordinaciones urgentes</span><strong className="urgent-text">{data.spaces.filter(s=>s.status==='Urgente').length}</strong><small>Requieren atención</small></div><div><span>Tareas por completar</span><strong>{pending}</strong><small>En todo el equipo</small></div><div><span>Para visto bueno</span><strong>{data.spaces.filter(s=>s.status==='Para V°B°').length}</strong><small>Pendientes de revisión</small></div></div>
 <div className="toolbar"><div className="search"><Icon name="search" size={19}/><input aria-label="Buscador global" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar contacto, CUT, teléfono, nota o tarea"/>{search&&<button aria-label="Limpiar búsqueda" onClick={()=>setSearch('')}>×</button>}</div><span>{filtered.length} espacios</span></div>
 <nav className="trays" aria-label="Bandejas">{['Todos',...STATUSES,'Mis Coordinaciones'].map(t=><button key={t} className={tray===t?'active':''} onClick={()=>setTray(t)}>{t==='Urgente'?'Urgentes':t==='Pendiente'?'Pendientes':t}</button>)}</nav>
 {view==='Kanban'?<div className="kanban">{STATUSES.map(status=><section className="kanban-column" key={status}><header><Badge status={status}/><span>{filtered.filter(s=>s.status===status).length}</span></header>{filtered.filter(s=>s.status===status).map(s=><article className="kanban-card" key={s.id}><button onClick={()=>{setSelected(s.id);setView('Directorio');}}><small>{s.org_unit} · {s.cut_code||'Sin CUT'}</small><h3>{s.name}</h3><p>{s.doc_ref||s.role}</p><span>{s.assignees.join(', ')||'Sin responsable'}</span></button><label className="sr-only" htmlFor={`status-${s.id}`}>Estado de {s.name}</label><select id={`status-${s.id}`} value={s.status} disabled={busy||!operator} onChange={e=>act('UPSERT_SPACE',{...s,status:e.target.value})}>{STATUSES.map(t=><option key={t}>{t}</option>)}</select></article>)}</section>)}</div>:<div className={`directory-layout ${space?'split':''}`}><section className="directory"><div className="list-head"><span>CONTACTO / COORDINACIÓN</span><span>ESTADO</span></div>{filtered.map(s=><button key={s.id} className={`space-card ${selected===s.id?'selected':''}`} onClick={()=>setSelected(s.id)}><Avatar name={s.name}/><div className="space-info"><div><small>{s.org_unit}</small>{s.cut_code&&<code>{s.cut_code}</code>}</div><h3>{s.name}</h3><p>{s.role||s.phone_or_group_id}</p><footer><Icon name="users" size={13}/><span>{s.assignees.join(', ')||'Por asignar'}</span><span className="task-count">{data.tasks.filter(t=>t.space_id===s.id&&!t.done).length} tareas</span></footer></div><div className="space-right"><Badge status={s.status}/><Icon name="arrow" size={17}/></div></button>)}{loaded&&!filtered.length&&<Empty title={search?'No encontramos coincidencias':'Tu agenda empieza aquí'}>{search?'Prueba otro nombre, CUT o texto.':'Crea un espacio de contacto para organizar la primera coordinación.'}</Empty>}{!loaded&&<p className="loading" role="status">Cargando la agenda del equipo</p>}</section>
 {space&&<SpaceDetail key={space.id} space={space} data={data} operator={operator} busy={busy} act={act} onEdit={()=>setSpaceForm(space)} onClose={()=>setSelected('')} presence={presence} device={device} notify={notify}/>}
 </div>}
 </main>}
 <footer className="workspace-footer"><span>Coordinación ANA · Agenda Cloud</span><span>Fechas de gestión en hora de Perú (UTC−5)</span></footer>
 </div>
 {spaceForm&&<SpaceForm initial={spaceForm} members={data.members} busy={busy} onSave={p=>act('UPSERT_SPACE',p)} onClose={()=>setSpaceForm(null)}/>}
 {teamOpen&&<Modal title="Integrantes del equipo" onClose={()=>setTeamOpen(false)}><p className="muted">Los cambios se comparten con todas las PC. Reasigna primero los espacios y tareas pendientes antes de eliminar un integrante.</p><div className="team-list">{data.members.map(m=><div key={m}><Avatar name={m}/><strong>{m}</strong><Button kind="quiet" disabled={busy||data.members.length<2} onClick={()=>{if(confirm(`¿Eliminar a ${m} del equipo?`))act('UPDATE_MEMBERS',{members:data.members.filter(x=>x!==m)});}}>Eliminar</Button></div>)}</div><Form className="row" onSave={async(f,form)=>{if(await act('UPDATE_MEMBERS',{members:[...data.members,String(f.get('member')).trim()]}))form.reset();}}><Field label="Nombre del nuevo integrante" name="member" required maxLength={80}/><Button disabled={busy}>Agregar</Button></Form></Modal>}
 </div>;
}
```

## src/components/UI.jsx

```jsx
import React,{useRef,useEffect,useId} from 'react';
export function Icon({name,size=20}){
 const paths={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',check:'M20 6L9 17l-5-5',plus:'M12 5v14 M5 12h14',arrow:'M5 12h14 M12 5l7 7-7 7',file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',database:'M21 5c0 2.2-4 4-9 4S3 7.2 3 5s4-4 9-4 9 1.8 9 4z M3 5v14c0 2.2 4 4 9 4s9-1.8 9-4V5 M3 12c0 2.2 4 4 9 4s9-1.8 9-4',calendar:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',copy:'M9 9h12v12H9z M5 15H3V3h12v2',close:'M6 6l12 12 M6 18L18 6',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',download:'M12 3v12 M6 9l6 6 6-6 M3 16v5h18v-5',logout:'M9 3H3v18h6 M9 12h12 M15 6l6 6-6 6'};
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
 return <main className="login"><section className="login-card"><div className="brand-mark">a<span>n</span>a</div><p className="eyebrow">COORDINACIÓN INSTITUCIONAL · MIDAGRI</p><h1>El equipo conectado.<br/>La gestión, en orden.</h1><p>Agenda cloud, seguimiento de CUT y acuerdos en un solo lugar.</p><form onSubmit={login}>
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
```

## src/components/SpaceDetail.jsx

```jsx
import React,{useState} from 'react';
import {signedText,minuteText} from '../../shared/domain.js';
import {clipboard} from '../api.js';
import {Button,Field,Form,Icon,Empty,Stamp,Badge,Avatar} from './UI.jsx';
export default function SpaceDetail({space,data,operator,act,busy,onEdit,onClose,presence,device,notify}){
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
 <div className="detail-meta"><Badge status={space.status}/><span>{space.phone_or_group_id}</span><Button kind="quiet" onClick={onEdit}>Editar</Button></div>
 <div className="reference"><span>CUT<strong>{space.cut_code||'Sin CUT'}</strong></span><span>DOCUMENTO<strong>{space.doc_ref||'Sin documento'}</strong></span></div>
 <p className="assignees"><Icon name="users" size={15}/>{space.assignees.join(', ')||'Sin responsables asignados'}</p></header>
 {others.length>0&&<div className="collision" role="status">⚠️ {others.join(', ')} también tiene abierto este espacio en otra PC</div>}
 <nav className="detail-tabs" aria-label="Herramientas del espacio">{['Bitácora','Tareas','Reuniones','Formatos /'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}{t==='Tareas'&&pending>0&&<span>{pending}</span>}</button>)}</nav>
 <section className="detail-body">
 {tab==='Bitácora'&&<><div className="section-title"><h3>Bitácora interna</h3><small>{notes.length} registros</small></div><Form className="note-form" onSave={async(f,form)=>{if(await act('ADD_NOTE',{id:crypto.randomUUID(),space_id:space.id,content:f.get('content')}))form.reset();}}><label className="sr-only" htmlFor="note-content">Nueva nota</label><textarea id="note-content" name="content" required maxLength={20000} rows={3} placeholder="Registra una actualización para el equipo"/><div><small>Firma: {operator||'elige un operador'}</small><Button disabled={busy||!operator}>Registrar nota <Icon name="arrow" size={16}/></Button></div></Form>
 <div className="timeline">{notes.length?notes.map(n=><article className="note" key={n.id}><Avatar name={n.author}/><div><header><strong>{n.author}</strong><Stamp value={n.created_at}/></header><p>{n.content}</p></div></article>):<Empty title="Una historia por empezar">Registra la primera coordinación de este contacto.</Empty>}</div></>}
 {tab==='Tareas'&&<><div className="section-title"><h3>Tareas y checklist</h3><small>{tasks.length-pending}/{tasks.length} completadas</small></div><Form className="stack card-form" onSave={async(f,form)=>{if(await act('UPSERT_TASK',{id:crypto.randomUUID(),space_id:space.id,title:f.get('title'),assignee:f.get('assignee'),due_date:f.get('due'),done:false}))form.reset();}}><Field label="Nueva tarea" name="title" required maxLength={500}/><div className="two-col"><Field label="Responsable"><select name="assignee" defaultValue={operator} required><option value="">Seleccionar</option>{data.members.map(m=><option key={m}>{m}</option>)}</select></Field><Field label="Fecha límite" type="date" name="due"/></div><Button disabled={busy||!operator}><Icon name="plus" size={16}/>Agregar tarea</Button></Form>
 {tasks.map(t=><article className={`task ${t.done?'done':''}`} key={t.id}><input type="checkbox" aria-label={`Completar ${t.title}`} checked={t.done} disabled={busy||!operator} onChange={()=>act('UPSERT_TASK',{...t,done:!t.done})}/><div><strong>{t.title}</strong><p>{t.assignee} {t.due_date&&`· ${t.due_date}`}</p><small>Creó: {t.created_by} · Última gestión: {t.updated_by}</small></div><button className="icon-btn" aria-label={`Eliminar tarea ${t.title}`} disabled={busy||!operator} onClick={()=>{if(confirm('¿Eliminar esta tarea?'))act('DELETE_TASK',{id:t.id});}}><Icon name="close" size={16}/></button></article>)}{!tasks.length&&<Empty title="Checklist despejado">Agrega la primera tarea con responsable y fecha.</Empty>}</>}
 {tab==='Reuniones'&&<><div className="section-title"><h3>Reuniones y minutas</h3><small>Hora de Perú</small></div><Form key={editingMeeting?.id||'new'} className="stack card-form" onSave={async(f,form)=>{
 const raw=f.get('datetime');
 const success=await act('ADD_MEETING',{id:editingMeeting?.id||crypto.randomUUID(),space_id:space.id,title:f.get('title'),datetime:new Date(`${raw}:00-05:00`).toISOString(),link:f.get('link'),participants:f.get('participants'),agreements:f.get('agreements')});
 if(success){form.reset();setEditingMeeting(null);}
 }}><Field label="Tema de la reunión" name="title" required maxLength={500} defaultValue={editingMeeting?.title||''}/><Field label="Fecha y hora (America/Lima)" type="datetime-local" name="datetime" required defaultValue={editingMeeting?new Date(new Date(editingMeeting.datetime).getTime()-5*3600000).toISOString().slice(0,16):''}/><Field label="Enlace de Meet o Zoom (opcional)" type="url" name="link" maxLength={2000} defaultValue={editingMeeting?.link||''}/><Field label="Participantes" name="participants" maxLength={3000} defaultValue={editingMeeting?.participants||''}/><Field label="Acuerdos · un acuerdo por línea"><textarea name="agreements" rows={3} maxLength={20000} defaultValue={editingMeeting?.agreements||''}/></Field><div className="row"><Button disabled={busy||!operator}>{editingMeeting?'Guardar cambios':'Agendar reunión'}</Button>{editingMeeting&&<Button kind="quiet" type="button" onClick={()=>setEditingMeeting(null)}>Cancelar</Button>}</div></Form>
 {meetings.map(m=><article className="meeting" key={m.id}><Stamp value={m.datetime}/><h4>{m.title}</h4><p>{m.participants}</p>{m.link&&<a href={m.link} target="_blank" rel="noopener noreferrer">Abrir sala ↗</a>}<p className="pre-line">{m.agreements}</p><small>Registró: {m.created_by} · Última gestión: {m.updated_by}</small><div className="row wrap"><Button kind="secondary" onClick={()=>{setCompose(minuteText(m,space));setTab('Formatos /');}}>Generar minuta</Button><Button kind="quiet" onClick={()=>setEditingMeeting(m)}>Editar</Button><Button kind="quiet" disabled={busy} onClick={()=>{if(confirm('¿Eliminar reunión?'))act('DELETE_MEETING',{id:m.id});}}>Eliminar</Button></div></article>)}{!meetings.length&&<Empty title="Próxima reunión">Agenda un encuentro y registra sus acuerdos.</Empty>}</>}
 {tab==='Formatos /'&&<><div className="section-title"><h3>Formatos y enlaces</h3><small>Compartidos en la nube</small></div><Field label="Buscar comando rápido"><input value={command} onChange={e=>setCommand(e.target.value)} placeholder="/drive, /tdr, /cut"/></Field><div className="templates">{data.templates.filter(t=>`${t.command} ${t.title}`.toLowerCase().includes(command.toLowerCase())).map(t=><article key={t.id}><button className="template-use" onClick={()=>{setCompose(t.content);setCommand('');}}><code>{t.command}</code><strong>{t.title}</strong></button><button className="icon-btn" aria-label={`Editar ${t.command}`} onClick={()=>setEditingTemplate(t)}><Icon name="settings" size={16}/></button><button className="icon-btn" aria-label={`Eliminar ${t.command}`} onClick={()=>{if(confirm('¿Eliminar formato compartido?'))act('DELETE_TEMPLATE',{id:t.id});}}><Icon name="close" size={16}/></button></article>)}</div>
 <Field label="Texto preparado / minuta"><textarea value={compose} maxLength={20000} rows={6} onChange={e=>setCompose(e.target.value)}/></Field><label className="switch"><input type="checkbox" checked={signature} onChange={e=>{setSignature(e.target.checked);localStorage.setItem('ana.signature',String(e.target.checked));}}/>Firma automática: *{operator||'Operador'} - Coord. ANA*</label><div className="row wrap"><Button disabled={!compose.trim()||!operator||busy} onClick={()=>composeAction()}><Icon name="copy" size={16}/>Copiar</Button><Button disabled={!compose.trim()||!operator||busy} kind="secondary" onClick={()=>composeAction(true)}>Abrir borrador en WhatsApp ↗</Button></div><small>No se envían mensajes automáticamente. La bitácora registra la preparación, no la entrega.</small>
 <details className="template-editor" open={!!editingTemplate}><summary>Crear o editar formato compartido</summary><Form key={editingTemplate?.id||'new'} className="stack card-form" onSave={async(f,form)=>{if(await act('UPSERT_TEMPLATE',{id:editingTemplate?.id||crypto.randomUUID(),command:f.get('command'),title:f.get('title'),content:f.get('content')})){setEditingTemplate(null);form.reset();}}}><Field label="Comando" name="command" required pattern="/[a-zA-Z0-9_\-]+" maxLength={40} defaultValue={editingTemplate?.command||''}/><Field label="Título" name="title" required maxLength={200} defaultValue={editingTemplate?.title||''}/><Field label="Texto o enlace"><textarea name="content" rows={3} required maxLength={20000} defaultValue={editingTemplate?.content||''}/></Field><div className="row"><Button disabled={busy||!operator}>Guardar formato</Button>{editingTemplate&&<Button type="button" kind="quiet" onClick={()=>setEditingTemplate(null)}>Cancelar edición</Button>}</div></Form></details></>}
 </section>
 </article>;
}
```

## src/components/DataCenter.jsx

```jsx
import React,{useState} from 'react';
import {request,downloadJson,clipboard} from '../api.js';
import {validateBackup} from '../../server/validation.js';
import {Button,Icon,Field,Modal} from './UI.jsx';
export default function DataCenter({data,session,operator,notify,onReload}){
 const [pending,setPending]=useState(null),[busy,setBusy]=useState(false),[showUrl,setShowUrl]=useState(false),[confirmText,setConfirmText]=useState('');
 const powerUrl=`${session.base}/api/powerbi?token=${encodeURIComponent(session.token)}`;
 async function exportBackup(){const backup=await request(session.base,session.token,'backup');downloadJson(backup,`Entrega_Cargo_ANA_${new Date().toISOString().slice(0,10)}.json`);}
 async function perform(fn){setBusy(true);try{await fn();}catch(e){notify(e.message,true);}finally{setBusy(false);}}
 async function readFile(e){
  const file=e.target.files[0];e.target.value='';if(!file)return;
  await perform(async()=>{if(file.size>1400000)throw new Error('La copia supera el límite de 1,4 MB para restauración interactiva. Usa el respaldo nativo D1 para volúmenes mayores.');const parsed=JSON.parse(await file.text());validateBackup(parsed);setPending(parsed);setConfirmText('');});
 }
 return <section className="data-center"><header className="page-heading"><div><p className="eyebrow">INFORMACIÓN QUE TRASCIENDE</p><h1>Centro de datos</h1><p>Reportes, análisis y continuidad del equipo.</p></div><Icon name="database" size={36}/></header>
 <div className="data-cards"><article className="data-card"><span className="data-icon"><Icon name="file" size={26}/></span><h2>Reporte maestro Excel</h2><p>Un libro real con cinco hojas: KPIs, agenda, tareas, bitácora y reuniones. Incluye responsables y códigos CUT.</p><div className="data-stat">{data.spaces.length}<small>espacios de contacto</small></div><Button disabled={busy} onClick={()=>perform(async()=>{const {downloadMasterExcel}=await import('../utils/excelExport.js');downloadMasterExcel(data);notify('Excel generado con 5 hojas');})}><Icon name="download"/>Descargar .xlsx</Button></article>
 <article className="data-card"><span className="data-icon"><Icon name="grid" size={26}/></span><h2>Conector Power BI</h2><p>En Power BI Desktop, selecciona «Obtener datos → Web». Conecta las cinco tablas del reporte.</p><Button kind="secondary" onClick={()=>setShowUrl(!showUrl)}>{showUrl?'Ocultar URL privada':'Mostrar URL privada'}</Button>{showUrl&&<Field label="URL con acceso de equipo (confidencial)"><textarea readOnly rows={4} value={powerUrl}/></Field>}<Button kind="quiet" onClick={()=>perform(async()=>{await clipboard(powerUrl);notify('URL privada copiada');})}><Icon name="copy" size={16}/>Copiar conexión</Button><small>La URL contiene el token maestro. Compártela solo con operadores autorizados; el historial y Power BI pueden conservarla.</small></article>
 <article className="data-card"><span className="data-icon"><Icon name="users" size={26}/></span><h2>Entrega de cargo</h2><p>Copia completa versionada: espacios, tareas, notas, reuniones, formatos e integrantes. No incluye tokens ni sesiones temporales.</p><Button disabled={busy} onClick={()=>perform(exportBackup)}><Icon name="download"/>Descargar respaldo .json</Button><label className={`btn secondary upload ${busy||!operator?'disabled':''}`}>Restaurar desde .json<input aria-label="Restaurar copia JSON" type="file" accept=".json,application/json" disabled={busy||!operator} onChange={readFile}/></label><small>Antes de restaurar se descarga otra copia del estado actual. Para más de 1,4 MB, usa exportación/importación nativa de D1.</small></article></div>
 {pending&&<Modal title="Restaurar entrega de cargo" onClose={()=>{if(!busy)setPending(null);}}><div className="stack"><p>Se reemplazarán todos los datos actuales por esta copia: {pending.data.spaces.length} espacios, {pending.data.notes.length} notas, {pending.data.tasks.length} tareas y {pending.data.meetings.length} reuniones.</p><p>Solicita al equipo cerrar los espacios durante la restauración. La operación es atómica; antes se descargará un respaldo del estado actual.</p><Field label="Escribe RESTAURAR para confirmar"><input value={confirmText} onChange={e=>setConfirmText(e.target.value)} autoComplete="off"/></Field><Button kind="danger" disabled={busy||confirmText!=='RESTAURAR'} onClick={()=>perform(async()=>{
 await exportBackup();await request(session.base,session.token,'backup',{confirm:'RESTAURAR',operator_name:operator,backup:pending});setPending(null);await onReload();notify('Copia restaurada correctamente');
 })}>{busy?'Restaurando':'Restaurar base completa'}</Button></div></Modal>}
 </section>;
}
```

## src/utils/excelExport.js

```javascript
import * as XLSX from 'xlsx';
import {reportTables} from '../../shared/domain.js';
export function createMasterWorkbook(data){
 const workbook=XLSX.utils.book_new();
 for(const [name,rows] of Object.entries(reportTables(data))){
  const sheet=XLSX.utils.json_to_sheet(rows);
  if(!rows.length)XLSX.utils.sheet_add_aoa(sheet,[['Sin registros']],{origin:'A1'});
  sheet['!cols']=Object.keys(rows[0]||{Estado:0}).map(key=>({wch:Math.min(55,Math.max(18,key.length+3))}));
  if(sheet['!ref'])sheet['!autofilter']={ref:sheet['!ref']};
  XLSX.utils.book_append_sheet(workbook,sheet,name);
 }
 return workbook;
}
export function downloadMasterExcel(data){XLSX.writeFile(createMasterWorkbook(data),`Reporte_Maestro_CRM_ANA_${new Date().toISOString().slice(0,10)}.xlsx`);}
```
