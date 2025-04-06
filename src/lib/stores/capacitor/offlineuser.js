import { Preferences } from '@capacitor/preferences';
let userdefault = {
    id:"",
    nombre:"",
    apellido:"",
    username:"",
    token:"",
    nivel:0
}
export async function setDefaultUserOffline() {
    await Preferences.set({
        key:"usuario",
        value:JSON.stringify(userdefault)
    })
}
export async function setUserOffline(id,nombre,apellido,username,token,nivel) {
    let u ={id,nombre,apellido,username,token,nivel}
    await Preferences.set({key:"usuario",value:JSON.stringify(u)})
}
export async function getUserOffline() {
    const u = await Preferences.get({ key: 'usuario' });
    if(u.value){
        return JSON.parse(u.value)
    }
    else{
        return userdefault
    }
}
