import React,{useCallback,useEffect,useRef,useState} from 'react';
import Login from './components/Login.jsx';
import AnaLogo from './components/AnaLogo.jsx';
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
 <aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setView('Directorio');}}><AnaLogo/><span className="brand-caption">COORDINACIÓN INSTITUCIONAL</span></a><div className="workspace-label">ESPACIO DE TRABAJO</div><nav aria-label="Navegación principal">{navigation.map(([label,icon])=><button key={label} className={view===label?'active':''} onClick={()=>{setView(label);setSelected('');}}><Icon name={icon}/>{label}{label==='Directorio'&&<span>{data.spaces.length}</span>}</button>)}</nav><div className="sidebar-note"><span className="live-dot"/><strong>Una agenda, todo el equipo</strong><p>Coordina con trazabilidad, incluso fuera de la oficina.</p></div><footer><span>ANA · MIDAGRI</span><small>Coordinación institucional</small></footer></aside>
 <div className="workspace"><header className="topbar"><div className="compact-brand"><AnaLogo/><span>COORDINACIÓN<br/>INSTITUCIONAL</span></div><div className="breadcrumb">Agenda cloud <span>/</span> <strong>{view}</strong></div><div className="operator"><Icon name="users" size={17}/><label htmlFor="operator">¿Quién opera esta PC?</label><select id="operator" aria-label="¿Quién opera esta PC?" value={operator} onChange={e=>{setOperator(e.target.value);localStorage.setItem('ana.operator',e.target.value);}}><option value="">Elegir operador</option>{data.members.map(m=><option key={m}>{m}</option>)}</select><button className="icon-btn" aria-label="Administrar integrantes" disabled={!operator} onClick={()=>setTeamOpen(true)}><Icon name="settings" size={17}/></button><button className="icon-btn" aria-label="Cerrar sesión" onClick={logout}><Icon name="logout" size={17}/></button></div></header>
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
