import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { createCaber } from './capcab.svelte';
import PocketBase from 'pocketbase'
let ruta = import.meta.env.VITE_RUTA
const pb = new PocketBase(ruta);
let cabdefault = {
    id:"",
    nombre:"",
    contacto:"",
    direccion:"",
    pending:false
}
export function managerCab(){
    let cab = $state(cabdefault)
    return {
        //Si tengo internet traigo los datos
        initOnline:async()=>{
            const ret = await Preferences.get({ key: 'caboffline' });
            if(ret.value){
                cab = JSON.parse(ret.value)
            }
            else{
                await Preferences.set({
                    key: 'caboffline',
                    value: JSON.stringify(cabdefault)
                });
            }
            const status = await Network.getStatus();
            
            if(status.connected){
                let caber = createCaber()
                await caber.init()
                if(cab.pending){
                    cab.pending = false
                    let data = {
                        nombre:cab.nombre,
                        contacto:cab.contacto,
                        direccion:cab.direccion
                    }
                    await pb.collection("cabs").update(cab.id,data)
                }
                else{
                    const record = await pb.collection("cabs").getOne(caber.cab.id)
                    cab = {
                        id:record.id,
                        nombre:record.nombre,
                        contacto:record.contacto,
                        direccion:record.direccion
                    }
                    await Preferences.set({
                        key: 'caboffline',
                        value: JSON.stringify(cab)
                    });
                }
                
            }
        },
        init:async()=>{
            const ret = await Preferences.get({ key: 'caboffline' });
            cab = JSON.parse(ret.value)
        },
        get cab(){
            return cab
        },
        updateCab: async (c)=>{
            cab.nombre = c.nombre
            cab.direccion = c.direccion
            cab.contacto = c.contacto
            cab.pending = true
            await Preferences.set({
                key: 'caboffline',
                value: JSON.stringify(cab)
            });
            const status = await Network.getStatus();
            if(status.connected){
                cab.pending = false
                try{
                    
                    await pb.collection("cabs").update(cab.id,c)
                }
                catch(err){
                    console.error(err)
                }
                
            }
        },
        
    }
}