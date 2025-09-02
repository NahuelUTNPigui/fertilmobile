import { Preferences } from '@capacitor/preferences';
import { loger } from '../logs/logs.svelte';
//debria agregar estxcolabs
let defaultcab = {
    exist:false,
    colaborador:false,
    nombre:"",
    id:"",
    permisos:""
}
export async function setDefaultCabOffline() {
    await Preferences.set({
        key:"cab",
        value:JSON.stringify(defaultcab)
    })
}
export async function setCabOffline(id,nombre,exist,permisos,colaborador=false) {
    let c = {id,nombre,exist,permisos,colaborador}
    await Preferences.set({key:"cab",value:JSON.stringify(c)})
}
export async function setCabNombreOffline(nombre) {
    let c = await getCabOffline()
    c = {
        ...c,
        nombre
    }
    
    await Preferences.set({key:"cab",value:JSON.stringify(c)})
}
export async function getCabOffline() {
    const c = await Preferences.get({ key: 'cab' });
    if(c.value){
        return JSON.parse(c.value)
    }
    else{
        return defaultcab
    }
}
export async function updatePermisos(pb,userid){
    const c = await Preferences.get({ key: 'cab' });
    loger.addTextLinea(41)
    loger.addTextLinea(JSON.stringify(c.value,null,2))
    if(c.value){
    loger.addTextLinea(44)
        let cab = JSON.parse(c.value)
        loger.addTextLinea(JSON.stringify(cab,null,2))
        if(cab.colaborador){
            const recordcolabcab = await pb.collection('estxcolabs').getList(1,1,{
                filter:`colab.user='${userid}' && cab='${cab.id}'`,
                expand: 'colab,cab,colab.user',
                skipTotal:true
            })
            if(recordcolabcab.items.length>0){
                let colabcab = recordcolabcab.items[0]
                const recordper = await pb.collection("permisos").getFirstListItem(`estxcolab='${colabcab.id}'`)
                cab.permisos = recordper.permisos
                await Preferences.set({key:"cab",value:JSON.stringify(cab)})
                return cab
            }
            else{
                return defaultcab
            }
        }
        else{
                
            return cab
        }
        
    }
    else{
        return defaultcab
    }
}