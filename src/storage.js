function store(name){
 const memory=new Map();let persistent=true;
 let backend;
 try{backend=globalThis[name];const key='ana.storage-check';backend.setItem(key,'1');backend.removeItem(key);}catch{persistent=false;}
 return {
  get persistent(){return persistent;},
  getItem(key){if(persistent){try{return backend.getItem(key);}catch{persistent=false;}}return memory.get(key)??null;},
  setItem(key,value){memory.set(key,String(value));if(persistent){try{backend.setItem(key,String(value));}catch{persistent=false;}}},
  removeItem(key){memory.delete(key);if(persistent){try{backend.removeItem(key);}catch{persistent=false;}}}
 };
}
export const localStore=store('localStorage'),sessionStore=store('sessionStorage');
