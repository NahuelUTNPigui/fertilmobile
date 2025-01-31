import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { createCaber } from './capcab.svelte';
import PocketBase from 'pocketbase'
let ruta = import.meta.env.VITE_RUTA
const pb = new PocketBase(ruta);
let animalesdef = []
export function managerAnimales(){
    let animales = $state(animalesdef)
    return {
        initOnline:async ()=>{
            const ret = await Preferences.get({ key: 'animalesoff' });
            if(ret.value){
                animales = JSON.parse(ret.value)
            }
            else{
                await Preferences.set({
                    key: 'animalesoff',
                    value: JSON.stringify(animales)
                });

            }
            const status = await Network.getStatus();
            if(status.connected){
                let caber = createCaber()
                await caber.init()
                const records = await pb.collection("animales").getFullList({
                    filter:`delete=false && cab='${caber.cab.id}'`,
                    expand:"nacimiento,lote,rodeo"
                })
                
                animales = records
                await Preferences.set({
                    key: 'animalesoff',
                    value: JSON.stringify(animales)
                });
                
            }
        },
        init:async ()=>{
            const ret = await Preferences.get({ key: 'animalesoff' });
            animales = JSON.parse(ret.value)
            
        },
        get animales(){
            return animales
        }
    }
}