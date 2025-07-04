import { Preferences } from '@capacitor/preferences';
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