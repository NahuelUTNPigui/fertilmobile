import { getEstablecimientosAsociadosSQL } from "./dbasociados"
import { getCabOffline } from "../capacitor/offlinecab"

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
export async function getUltimoAnimalesSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 1")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
export async function setUltimoAnimalesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = '${Date.now()}' WHERE id = 1`)
}

export async function editarAnimalSQL(db,id,animal) {
    let animales = await getAnimalesSQL(db);
    let lista = animales.lista;

    // Busca el índice del animal a editar
    let idx = lista.findIndex(a => a.id == id);
    if (idx !== -1) {
        // Reemplaza los datos del animal en la posición encontrada
        lista[idx] = { ...lista[idx], ...animal }; 
        // Guarda la lista actualizada
        await setAnimalesSQL(db, lista);
        return true; // Edición exitosa
    } else {
        return false; // Animal no encontrado
    }
}
export async function deleteAnimalSQL(db,id) {
    let animales = await getAnimalesSQL(db)
    let lista = animales.lista
    lista = lista.filter(a=>a.id!= id)
    await setAnimalesSQL(db,lista)
}

//Que hacemos con los expand?, deberia ser en el momento de crear el animal
export async function addNewAnimalSQL(db,animal) {
    let animales = await getAnimalesSQL(db)
    let lista = animales.lista
    lista.push(animal)
    await setAnimalesSQL(db,animales)
    return animales
    
}
export async function updateLocalAnimalesSQLUser(db,pb,userid) {
    
    //Con esta linea puedo dar velocidad
    const recordsa = await pb.collection("animales").getFullList({
        filter:`delete=false && cab.user='${userid}'`,
        expand:"rodeo,lote,nacimiento,cab"
    })
    let animales = recordsa
    //---- Asociados

    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline() 
    
    if(caboff.colaborador){
        if(!asociados.includes(caboff.id)){
            asociados.push(caboff.id)
        }
    }

    for(let i = 0;i<asociados.length;i++){
        const animal_colab = await pb.collection("animales").getFullList({
            filter:`delete=false && cab='${asociados[i]}'`,
            expand:"rodeo,lote,nacimiento,cab",
            
        })
        animales = animales.concat(animal_colab)
    }
    //---fin
    await setAnimalesSQL(db,animales)
    await setUltimoAnimalesSQL(db)
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
export async function getUpdateLocalAnimalesSQLUser(db,pb,userid,cabid) {
    let animales = await updateLocalAnimalesSQLUser(db,pb,userid)
    animales  = animales.filter(a=>a.active && a.cab == cabid)
    return animales
}
export async function getAnimalesCabSQL(db,cabid) {
    let resanimal = await getAnimalesSQL(db)
    let animales = resanimal.lista.filter(a=>a.active && a.cab == cabid)
    return animales
    
}
// Historial de cambios
export async function getHistorialAnimalesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 13")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function setHistorialAnimalesSQL(db,animales) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(animales)}' WHERE id = 13`)
}
export async function setUltimoHistorialAnimalesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = '${Date.now()}' WHERE id = 13`)
}
export async function addNewHistorialAnimalesSQL(db,animal) {
    let animales = await getHistorialAnimalesSQL(db)
    let lista = animales.lista
    lista.push(animal)
    await setHistorialAnimalesSQL(db,lista)
    return animales
}
export async function deleteHistorialAnimalesSQL(db,id) {
    let animales = await getHistorialAnimalesSQL(db)
    let lista = animales.lista
    lista = lista.filter(a=>a.id!= id)
    await setHistorialAnimalesSQL(db,lista)
    return animales
}
//Esto de los historiales no seria filtrado por establecimiento sino por  el  usuario que le pertenece el animal
export async function updateLocalHistorialAnimalesSQLUser(db,pb,userid) {
    const recordsa = await pb.collection("historialanimales").getFullList({
        filter:`active=true && delete=false && user='${userid}'`,
        expand:"rodeo,lote,nacimiento,animal"
    })
    let historial = recordsa
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
        let records_asociados = await pb.collection("historialanimales").getFullList({
            filter:`active=true && delete=false && animal.cab='${asociados[i]}'`,
            expand:"rodeo,lote,nacimiento,animal"
        })
        historial = historial.concat(records_asociados)
    }

    //Fin Asociados
    await setHistorialAnimalesSQL(db,historial)
    await setUltimoHistorialAnimalesSQL(db)
    return historial
}
export async function updateLocalHistorialAnimalesSQL(db,pb,cabid) {
    const recordsa = await pb.collection("historialanimales").getFullList({
        filter:`active=true && delete=false && cab='${cabid}'`,
        expand:"rodeo,lote,cab,nacimiento"
    })
    let animales = recordsa
    await setHistorialAnimalesSQL(db,animales)
    await setUltimoHistorialAnimalesSQL(db)
    return animales
}
export async function getHistorialesAnimalSQLByIDAnimal(db,id) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 13")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let animals = lista.filter((a) => a.animal == id)
    return animals
    
}