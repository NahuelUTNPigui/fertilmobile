export async function getComandosSQL(db) {
    let rowcommand = await db.query("select id,lista from Comandos where id = 1")
    
    let comands = rowcommand.values[0]
    let lista = JSON.parse(comands.lista)
    comands.lista = lista
    return comands
}
export async function setComandosSQL(db,lista) {
    await db.run(`UPDATE Comandos SET lista = '${JSON.stringify(lista)}' WHERE id = 1`)
}
export async function concatComandosSQL(db,comandos) {
    let rowcommand = await db.query("select id,lista from Comandos where id = 1")
    
    let comands = rowcommand.values[0]
    let lista = JSON.parse(comands.lista)
    let nuevalista = lista.concat(comandos)
    await setComandosSQL(db,nuevalista)
}

function processData(data,campos,coleccion,tablaids) {
    let newData = {...data}
    if(coleccion=="inseminacion"){
        if(campos.includes("padre")){
            let idnuevo = tablaids[data.padre]
            newData.padre = idnuevo
        }
        if(campos.includes("animal")){
            let idnuevo = tablaids[data.animal]
            newData.animal = idnuevo
        }
    }
    else if(coleccion == "historialanimales"){
        if(campos.includes("lote")){
            let idnuevo = tablaids[data.lote]
            newData.lote = idnuevo
        }
        if(campos.includes("rodeos")){
            let idnuevo = tablaids[data.rodeo]
            newData.rodeo = idnuevo
        }
    }
    else if(coleccion == "servicios"){
        if(campos.includes("madre")){
            let idnuevo = tablaids[data.madre]
            newData.madre = idnuevo
        }
        if(campos.includes("padres")){
            let nuevospadres = ""
            let ids = data.padres.split(",")
            for(let i = 0;i<ids.length;i++){
                let idnuevo = tablaids[ids[i]]
                if(idnuevo){
                    if(i==0){
                        nuevospadres += idnuevo
                    }
                    else{
                        nuevospadres += ","+idnuevo
                    }
                }
                else{
                    if(i==0){
                        nuevospadres += ids[i]
                    }
                    else{
                        nuevospadres += ","+ids[i]
                    }
                }
                
            }
            newData.padres = nuevospadres
            
        }
    }
    else if(coleccion=="tactos"){
        if(campos.includes("animal")){
            let idnuevo = tablaids[data.animal]
            newData.animal = idnuevo
        }
    }
    else if(coleccion == "tratamientos"){
        if(campos.includes("animal")){
            let idnuevo = tablaids[data.animal]
            newData.animal = idnuevo
        }
        if(campos.includes("tipo")){
            let idnuevo = tablaids[data.tipo]
            newData.tipo = idnuevo
        }
    }
    else if(coleccion == "pesaje"){
        if(campos.includes("animal")){
            let idnuevo = tablaids[data.animal]
            newData.animal = idnuevo
        }
    }
    else if(coleccion == "animales"){
        if(campos.includes("nacimiento")){
            let idnuevo = tablaids[data.nacimiento]
            newData.nacimiento = idnuevo
        }
        if(campos.includes("lote")){
            let idnuevo = tablaids[data.lote]
            newData.lote = idnuevo
        }
        if(campos.includes("rodeo")){
            let idnuevo = tablaids[data.rodeo]
            newData.rodeo = idnuevo
        }
    }
    else if(coleccion == "nacimientos"){
        if(campos.includes("madre")){
            let idnuevo = tablaids[data.madre]
            newData.madre = idnuevo
        }
        if(campos.includes("padre")){
            let idnuevo = tablaids[data.padre]
            newData.padre = idnuevo
        }
    }
    else if(coleccion == "observaciones"){
        if(campos.includes("animal")){
            let idnuevo = tablaids[data.animal]
            newData.animal = idnuevo
        }
    }
    delete newData.expand
    return newData
}
async function addComando(pb,c,tablaids) {
    let id = c.idprov
    //Campos deberia tener el nombre del atributo
    let campos = c.camposprov.split(",")
    let coleccion = c.coleccion
    
    let data = processData(c.data,campos,coleccion,tablaids)
    
    //DATA TIENE EL CAMPO ID LO CUAL ES UN PROBLEMA
    delete data.id
    let res = {id:"x"}
    try{
        return await pb.collection(coleccion).create(data)
    }
    catch(err){
        console.error(err)
        
        return res
    }
    
    
}
async function modComando(pb,c,tablaids) {
    let id = c.idprov
    // Aca veo si editor un registro local y por ende necesito revisar el id asignado
    if(id.split("_").length > 0){
        let id = tablaids[id]
    }
    //Campos deberia tener el nombre del atributo
    let campos = c.camposprov.split(",")
    let coleccion = c.coleccion
    if (coleccion != "users"){
        let data = processData(c.data,campos,coleccion,tablaids)
        delete data.id
        await pb.collection(coleccion).update(id,data)
    }
    else{
        console.log("editar usuario")
    }
    
    //let idnuevo = await pb.collection(coleccion).update(id,data)
}
async function delComando(pb,c,tablaids) {
    let id = c.idprov
    // Aca veo si editor un registro local y por ende necesito revisar el id asignado
    if(id.split("_").length > 0){
        let id = tablaids[id]
    }
    let coleccion = c.coleccion
    await pb.collection(coleccion).delete(id)
}
//Si pongo aca el historial?
export async function flushComandosSQL(db,pb) {
    let rescoms = await getComandosSQL(db)
    let listacomandos = []
    // Aca guardo los id de los nuevos registros con su id en la base de datos
    let tablaids = {}
    // Aca paso los comandos a un array,
    // La prioridad no sirve porque estan conectados
    for(let i = 0;i<rescoms.lista.length;i++){
        let c = rescoms.lista[i]
        listacomandos.push(c)
    }
    
    //No puedo usar batchs porquequiero los id
    for(let i = 0;i<listacomandos.length;i++){
        let c = listacomandos[i]
        
        let id = c.idprov
        let accion = c.tipo
        if(accion=="add"){
            let datanuevo = await addComando(pb,c,tablaids)
            

            tablaids[id] = datanuevo.id
            
        }
        else if(accion=="update"){
            await modComando(pb,c,tablaids)
        }
        else if(accion=="delete"){
            await delComando(pb,c,tablaids)
        }
    }

    await setComandosSQL(db,[])
    
}

