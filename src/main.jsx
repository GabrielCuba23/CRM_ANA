import React from 'react';
import {createRoot} from 'react-dom/client';
import './panelBridge.js';
import './styles.css';
const root=createRoot(document.getElementById('root'));
import('./App.jsx').then(({default:App})=>{
 root.render(<React.StrictMode><App/></React.StrictMode>);
}).catch(()=>root.render(<main className="startup-error"><h1>No se pudo abrir el CRM</h1><p>Comprueba la conexión y permite el almacenamiento del sitio. También puedes abrir el CRM en una pestaña del navegador.</p><a href={location.origin} target="_blank" rel="noreferrer">Abrir CRM en el navegador ↗</a><button onClick={()=>location.reload()}>Volver a intentar</button></main>));
