//Encima creo que aca va el animalesacto
//Aca estaria la logica de traer animales
export async function getAnimalesSQL(db){
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 1")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function setAnimalesSQL(db,animales) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(animales)}' WHERE id = 1`)
}
export async function setUltimoAnimalesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = '${Date.now()}' WHERE id = 1`)
}
export async function addNewAnimal(db,animal) {
    let animales = await getAnimalesSQL(db)
    let lista = animales.lista
    lista.push(animal)
    await setUltimoAnimalesSQL(db,lista)
    
}
export async function updateLocalAnimales(db,pb) {
    const recordsa = await pb.collection("animales").getFullList({
        filter:`active=true && delete=false && cab='${cab.id}'`,
        expand:"rodeo,lote,cab"
    })
    let animales = recordsa
    await setAnimalesSQL(db,animales)
    await setUltimoAnimalesSQL(db)
    return animales
}