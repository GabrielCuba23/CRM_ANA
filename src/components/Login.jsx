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
