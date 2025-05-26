import { setEstablecimientoSQL } from "./dbestablecimiento"
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
    await setEstablecimientosSQL(db,establecimientos)
    return establecimientos
}
export async function updateLocalEstablecimientosSQL(db,pb,userid,cabid) {
    const records = await pb.collection('cabs').getFullList({
        filter:`user='${userid}' && active=true`,
    });
    let establecimientos = records
    let estableciento = establecimientos.filter((e) => e.id == cabid)
    await setEstablecimientosSQL(db,establecimientos)
    await setEstablecimientoSQL(db,estableciento)
    return establecimientos
}
