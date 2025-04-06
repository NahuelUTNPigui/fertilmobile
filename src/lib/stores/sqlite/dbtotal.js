export async function getTotalSQL(db){
    let lista_json = await db.query("select id,numero,ultimo from Animalesuser where id = 1")
    let fila = lista_json.values[0]
    let coleccion = {...fila}
    return coleccion
}
export async function setTotalSQL(db,total) {
    await db.run(`UPDATE Animalesuser SET numero = ${total} WHERE id = 1`)
}
export async function setUltimoTotalSQL(db) {
    await db.run(`UPDATE Animalesuser SET ultimo = '${Date.now()}' WHERE id = 1`)
}