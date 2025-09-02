import cuentas from '$lib/stores/cuentas';
import {getUserOffline} from '$lib/stores/capacitor/offlineuser';
import { loger } from '$lib/stores/logs/logs.svelte';
let ruta = import.meta.env.VITE_RUTA
export function getPermisosList(per){
    let userpermisos = [false,false,false,false,false,false]
    if(per.length!=0){
        for(let i = 0;i<per.length;i++){
            let idx = parseInt(per[i], 10)
            userpermisos[idx] = true
        }
    }
    return userpermisos
}
export function getPermisosMessage(per){
    let permisosmap ={
        0:"No tienes permisos administrar el establecimiento",
        1:"No tienes permisos de crear grupos",
        2:"No tienes permisos para importar",
        3:"No tienes permisos para hacer movimientos",
        4:"No tienes permisos para administrar eventos",
        5 :"No tienes permisos para administrar animales"
    }              
    return permisosmap[per]
}
export async function verificarNivel(cabid) {
    
    let rescabnivel = await fetch(`${ruta}/api/creciente/cabmax/${cabid}`)
    let result = await rescabnivel.json()
    let cabnivel = result.result
    let nivel  = cuentas.filter(c=>c.nivel == cabnivel.nivel)[0]
    if(nivel.animales != -1 && cabnivel.cantidadanimales >= nivel.animales){
        return  false
    }
    else{
        return true
    }
}
export async function verificarNivelCantidad(cabid,nuevos) {

    let rescabnivel = await fetch(`${ruta}/api/creciente/cabmax/${cabid}`)
    let result = await rescabnivel.json()
    let cabnivel = result.result

    let nivel  = cuentas.filter(c=>c.nivel == cabnivel.nivel)[0]

    if(nivel.animales != -1 && (cabnivel.cantidadanimales+nuevos) >= nivel.animales){
        return  false
    }
    else{
        return true
    }
}
export async function verificarNivelColab(cabid) {
    
    let rescabnivel = await fetch(`${ruta}/api/creciente/colabmax/${cabid}`)
    let result = await rescabnivel.json()
    let cabnivel = result.result
    let nivel  = cuentas.filter(c=>c.nivel == cabnivel.nivel)[0]
    if(nivel.usuarios != -1 && cabnivel.cantidadcolabs >= nivel.usuarios){
        return  false
    }
    else{
        return true
    }
}
export async function verificarNivelOffline(animalestotal,nuevos) {
    let user = await getUserOffline()
    let nivel = cuentas.filter(c=>c.nivel == user.nivel)[0]
    if(nivel.animales != -1 && (animalestotal+nuevos) > nivel.animales){
        return false
    }
    return true
}

export async function verificarNivelColabOffline(cabid) {
    return true
}
export async function   getPermisosCabUser(pb,userid,cabid) {
    const recordcolabcab = await pb.collection('estxcolabs').getList(1,1,{
        filter:`colab.user='${userid}' && cab='${cabid}'`,
        expand: 'colab,cab,colab.user'

    })
    if(recordcolabcab.items.length>0){
        let colabcab = recordcolabcab.items[0]
    
    
        let respermisos = await pb.collection("permisos").getList(1, 1, {
            filter: `estxcolab = '${colabcab.id}'`,
            skipTotal :true
        });
        if(respermisos.items>0){
            return respermisos.items[0]
        }
        else{
            return {id:"",permisos:""}
        }
        
    }
    else{
        return {id:"",permisos:""}
    }
    
}
export async function getPermisosEstXColab(pb,estxcolab) {
    let respermisos = await pb.collection("permisos").getList(1, 1, {
        filter: `estxcolab = '${estxcolab}'`,
        skipTotal :true
    });
    return respermisos
    
}
export function esColab(cab,userid){
    return cab.user == userid
}