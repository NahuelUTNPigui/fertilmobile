import cuentas from '$lib/stores/cuentas';
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
export async function verificarNivelOffline(cabid) {
    return true
}
export async function verificarNivelCantidad(cabid,nuevos) {
    return true
}
export async function verificarNivelColabOffline(cabid) {
    return true
}