//Esto es la lista de establecimientos asociados que quiero offline
//Van a ser cabid
export async function setEstablecimientosAsociadosSQL(db, establecimientos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(establecimientos)}' WHERE id = 16`)
}
export async function getEstablecimientosAsociadosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 16")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function addNewEstablecimientoAsosciaodSQL(db,id){
    let establecimientos = await getEstablecimientosAsociadosSQL(db)
    let lista = establecimientos.lista
    lista.push(id)
    await setEstablecimientosAsociadosSQL(db, lista)
    return lista
}
export async function deleteEstablecimientosAsociadosSQL(db, id) {
    let establecimientos = await getEstablecimientosAsociadosSQL(db)
    let lista = establecimientos.lista
    lista = lista.filter(e_id => e_id != id)
    await setEstablecimientosAsociadosSQL(db, lista)
    return lista
}
