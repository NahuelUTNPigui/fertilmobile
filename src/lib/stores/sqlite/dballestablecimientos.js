import { setEstablecimientoSQL } from "./dbestablecimiento"
import { getEstablecimientosAsociadosSQL } from "./dbasociados"
import { getCabOffline } from "../capacitor/offlinecab"
import { loger } from "../logs/logs.svelte"

/*
//Asociados
let resasociados = await getEstablecimientosAsociadosSQL(db)
let asociados = resasociados.lista
let caboff = await getCabOffline() 
    
if(caboff.colaborador){
    if(!asociados.includes(caboff.id)){
        asociados.push(caboff.id)
    }
}

for(let i = 0;i<asociados.length;i++){
    //asociados[i]
    //Accion
}

//Fin Asociados
*/
//Esta funcion es la que hace el cambio de un establecimiento a otro
export async function getEstablecimientoSQLByID(db,pb,id){
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 14")
    let fila = lista_json.values[0]
    //Lista de establecimientos
    let lista = JSON.parse(fila.lista)
    let ests = lista.filter((e) => e.id == id)
    if(ests.length > 0){
       return ests[0]
    }
    else{ 
        return null
    }
}
export async function setEstablecimientosSQL(db,establecimientos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(establecimientos)}' WHERE id = 14`)
}
export async function getEstablecimientosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 14")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function deleteEstablecimientosSQL(db,id) {
    let establecimientos = await getEstablecimientosSQL(db)
    let lista = establecimientos.lista
    lista = lista.filter(a=>a.id!= id)
    await setEstablecimientosSQL(db,lista)
}
export async function addNewEstablecimientoSQL(db,establecimiento) {
    let establecimientos = await getEstablecimientosSQL(db)
    let lista = establecimientos.lista
    lista.push(establecimiento)
    await setEstablecimientosSQL(db,lista)
    return establecimientos
}

export async function getUpdateLocalEstablecimientosSQL(db,pb,userid) {
    const records = await pb.collection('cabs').getFullList({
        filter:`user='${userid}' && active=true`,
    });
    let establecimientos = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline() 
    if(caboff.colaborador){
        if(!asociados.includes(caboff.id)){
            asociados.push(caboff.id)
        }
    }

    for(let i = 0;i<asociados.length;i++){
        //Necesito los permisos
        let est_asociados = await pb.collection('cabs').getFullList({
            filter:`id='${asociados[i]}' && active=true`,
            
        });
        if(est_asociados.length > 0){
            establecimientos.push(est_asociados[0])
        }
    }
    //Fin Asociados
    await setEstablecimientosSQL(db,establecimientos)
    
    return establecimientos
}
//Aca deberia hacer lo de los asociados
export async function updateLocalEstablecimientosSQL(db,pb,userid,cabid) {
    
    const records = await pb.collection('cabs').getFullList({
        filter:`user='${userid}' && active=true`,
    });
    let establecimientos = records

    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()
    
    if(caboff.colaborador){
        if(!asociados.includes(caboff.id)){
            asociados.push(caboff.id)
        }
    }
    
    for(let i = 0;i<asociados.length;i++){
        
        let est_asociados = await pb.collection('cabs').getFullList({
            filter:`id='${asociados[i]}' && active=true`
        });
        
        if(est_asociados.length > 0){
            
            establecimientos.push(est_asociados[0])
        }
    }
    //FIN Asociados
    let establecimiento = establecimientos.filter((e) => e.id == cabid)
    await setEstablecimientosSQL(db,establecimientos)
    await setEstablecimientoSQL(db,establecimiento[0])
    return establecimientos
}
export async function setUltimoEstablecimientosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 14`)
}
export async function getUltimoEstablecimientosSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 14")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
