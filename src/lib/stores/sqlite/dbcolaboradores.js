export async function getColabSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 15")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getColabSQLByID(db,id) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 15")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let colabs = lista.filter((a) => a.id == id)
    if(colabs.length > 0){
       return colabs[0]
    }
    else{
        return null
    }
}
export async function setColabSQL(db,colabs) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(colabs)}' WHERE id = 15`)
}
export async function deleteColabSQL(db,id) {
    let colabs = await getColabSQL(db)
    colabs.lista = colabs.lista.filter((a) => a.id != id)
    await setColabSQL(db,colabs.lista)
}
export async function setPermisoColabSQL(db,id,permisos) {
    let colabs = await getColabSQL(db)
    let colab = colabs.lista.filter((a) => a.id == id)
    if(colab.length > 0){
        colab[0].permisos = permisos
        await setColabSQL(db,colabs.lista)
    }
}
export async function updateLocalColabSQLUser(db,pb,userid){
    const records = await pb.collection('estxcolabspermisos').getFullList({
        expand:"colab,cab",
        filter:`cab.user='${userid}'`
    });
    let colabs = records
    await setColabSQL(db,colabs)
    return colabs
}
export async function updateLocalColabSQL(db,pb,cabid){
    const records = await pb.collection('estxcolabspermisos').getFullList({
        expand:"colab",
        filter:`cab='${cabid}'`
    });
    let colabs = records
    await setColabSQL(db,colabs)
    return colabs
}
