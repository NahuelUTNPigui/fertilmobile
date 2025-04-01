//Aca estaria la logica de traer animales
export async function getAnimales(db){
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 1")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function setAnimales(db,animales) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(animales)}' WHERE id = 1`)
}
export async function setUltimoAnimales(db) {
    await db.run(`UPDATE Colecciones SET ultimo = '${Date.now()}' WHERE id = 1`)
}