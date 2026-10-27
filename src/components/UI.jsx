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
