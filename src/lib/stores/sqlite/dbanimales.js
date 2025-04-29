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
export async function getAnimalSQLByID(db,id) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 1")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let animals = lista.filter((a) => a.id == id)
    if(animals.length > 0){
       return animals[0]
    }
    else{
        return null
    }
}
export async function setAnimalesSQL(db,animales) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(animales)}' WHERE id = 1`)
}
export async function setUltimoAnimalesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = '${Date.now()}' WHERE id = 1`)
}
export async function deleteAnimalSQL(db,id) {
    let animales = await getAnimalesSQL(db)
    let lista = animales.lista
    lista = lista.filter(a=>a.id!= id)
    await setAnimalesSQL(db,lista)
}
//Que hacemos con los expand?
export async function updateAnimalSQL(db,id,animal) {
    let animales = await getAnimalesSQL(db)
    let lista = animales.lista
    let idx = lista.findIndex(a=>a.id==id)
    if(idx != -1){
        lista[idx] = animal
    }
    await setAnimalesSQL(db,lista)
}
//Que hacemos con los expand?
export async function addNewAnimalSQL(db,animal) {
    let animales = await getAnimalesSQL(db)
    let lista = animales.lista
    lista.push(animal)
    await setAnimalesSQL(db,animales)
    return animales
    
}
export async function updateLocalAnimalesSQL(db,pb,cabid) {
    const recordsa = await pb.collection("animales").getFullList({
        filter:`active=true && delete=false && cab='${cabid}'`,
        expand:"rodeo,lote,cab,nacimiento"
    })
    let animales = recordsa
    await setAnimalesSQL(db,animales)
    await setUltimoAnimalesSQL(db)
    return animales
}