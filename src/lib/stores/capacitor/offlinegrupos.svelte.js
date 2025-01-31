import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { createCaber } from './capcab.svelte';
import PocketBase from 'pocketbase'
let ruta = import.meta.env.VITE_RUTA
const pb = new PocketBase(ruta);
let grupos = []
export function managerGrupos(){
    let lotes = $state(grupos)
    let rodeos = $state(grupos)
    return {
        initOnline:async ()=>{
            const retlotes = await Preferences.get({ key: 'lotesoff' });
            if(retlotes.value){
                lotes = JSON.parse(retlotes.value)
            }
            else{
                await Preferences.set({
                    key: 'lotesoff',
                    value: JSON.stringify(lotes)
                });

            }
            const retrodeos = await Preferences.get({ key: 'rodeosoff' });
            if(retrodeos.value){
                rodeos = JSON.parse(retrodeos.value)
            }
            else{
                await Preferences.set({
                    key: 'rodeosoff',
                    value: JSON.stringify(rodeos)
                });

            } 
            
            const status = await Network.getStatus();
            if(status.connected){
                let caber = createCaber()
                await caber.init()
                const recordslotes = await pb.collection('lotes').getFullList({
                    filter:`active = true && cab = '${caber.cab.id}'`,
                    sort: 'nombre',
                });
                const recordsrodeos = await pb.collection('rodeos').getFullList({
                    filter:`active = true && cab = '${caber.cab.id}'`,
                    sort: 'nombre',
                });
                lotes = recordslotes
                rodeos = recordsrodeos
                await Preferences.set({
                    key: 'lotesoff',
                    value: JSON.stringify(lotes)
                });
                await Preferences.set({
                    key: 'rodeosoff',
                    value: JSON.stringify(rodeos)
                });
            }
        },
        init:async ()=>{
            const retlotes = await Preferences.get({ key: 'lotesoff' });
            lotes = JSON.parse(retlotes.value)
            const retrodeos = await Preferences.get({ key: 'rodeosoff' });
            rodeos = JSON.parse(retrodeos.value)
              
        },
        get rodeos(){
            return rodeos
        },
        get lotes(){
            return lotes
        }
    }
}