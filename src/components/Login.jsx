import {localStore,sessionStore} from '../storage.js';
import React,{useState} from 'react';
import {request} from '../api.js';
import {Button,Field,Icon} from './UI.jsx';
import AnaLogo from './AnaLogo.jsx';
export default function Login({onLogin}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function login(e){
  e.preventDefault();setBusy(true);setError('');
  const f=new FormData(e.currentTarget);
  try{
   const base=location.origin,token=String(f.get('token')).trim();
   const data=await request(base,token,'sync');
   localStore.setItem('ana.api',base);sessionStore.setItem('ana.token',token);onLogin({base,token,data});
  }catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <main className="login"><section className="login-card"><div className="login-brand"><AnaLogo/></div><p className="eyebrow">COORDINACIÓN INSTITUCIONAL · MIDAGRI</p><h1>El equipo conectado.<br/>La gestión, en orden.</h1><p>Agenda cloud, seguimiento de CUT y acuerdos en un solo lugar.</p><form onSubmit={login}>
 <Field label="Token de acceso del equipo" name="token" type="password" minLength={24} maxLength={1024} required autoComplete="current-password"/>
 {error&&<p className="error" role="alert">{error}</p>}<Button disabled={busy} type="submit">{busy?'Conectando':'Entrar al espacio de trabajo'}<Icon name="arrow"/></Button>
 </form><small>Acceso compartido del equipo. Elige tu operador después de ingresar.</small></section><aside className="login-aside"><span>AGENDA CLOUD</span><h2>Cada coordinación<br/>tiene su espacio.</h2><p>Del primer contacto al último acuerdo.</p><div className="water-lines"/></aside></main>;
}
