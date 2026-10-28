import React,{useEffect,useState} from 'react';
import {hasPendingWrites} from '../api.js';
export default function VersionNotice(){
 const [release,setRelease]=useState(null),[waiting,setWaiting]=useState(false);
 useEffect(()=>{
  let alive=true,reading=false;
  async function check(){
   if(reading||document.visibilityState==='hidden')return;reading=true;
   try{
    const response=await fetch(`./version.json?check=${Date.now()}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return;const value=await response.json();
    if(alive&&typeof value.build==='string'&&value.build!==__APP_BUILD__&&typeof value.version==='string')setRelease(value.version);
   }catch{}finally{reading=false;}
  }
  check();const timer=setInterval(check,60000);document.addEventListener('visibilitychange',check);
  return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',check);};
 },[]);
 if(!release)return null;
 function update(){
  if(hasPendingWrites()){setWaiting(true);return;}
  if(window.confirm('Guarda primero los cambios de tus formularios. Se recargará el CRM para abrir la nueva versión. ¿Continuar?'))location.reload();
 }
 return <div className="release-banner" role="status"><span>Nueva versión del CRM disponible ({release}). Guarda tus cambios antes de actualizar.{waiting&&' Espera a que termine el guardado en curso.'}</span><button type="button" onClick={update}>Actualizar CRM</button></div>;
}
