export async function getEventosSQL(db) {
    let tactos = await getTactosSQL(db)
    let servicios = await getServiciosSQL(db)
    let inseminaciones = await getInseminacionesSQL(db)
    let observaciones = await getObservacionesSQL(db)
    let lotes = await getLotesSQL(db)
    let rodeos = await getRodeosSQL(db)
    let tipostrat = await getTiposTratSQL(db)
    let trats = await getTratsSQL(db)
    let nacimientos = await getNacimientosSQL(db)
    let animaleselegir = await getAnimalesElegirSQL(db)
    let pesajes = await getPesajesSQL(db)
    return {tactos,servicios,inseminaciones,observaciones,lotes,rodeos,tipostrat,trats,nacimientos,animaleselegir,pesajes};
}
export async function setEventosSQL(db,tactos,servicios,inseminaciones,observaciones,lotes,rodeos,tipostrat,trats,nacimientos,animaleselegir,pesajes) {
    await setTactosSQL(db,tactos)
    await setServiciosSQL(db,servicios)
    await setInseminacionesSQL(db,inseminaciones)
    await setObservacionesSQL(db,observaciones)
    await setLotesSQL(db,lotes)
    await setRodeosSQL(db,rodeos)
    await setTiposTratSQL(db,tipostrat)
    await setTratsSQL(db,trats)
    await setNacimientosSQL(db,nacimientos)
    await setAnimalesElegirSQL(db,animaleselegir)
    await setPesajesSQL(db,pesajes)
}
export async function setUltimoEventosSQL(db){
    await setUltimoTactosSQL(db)
    await setUltimoServiciosSQL(db)
    await setUltimoInseminacionesSQL(db)
    await setUltimoObservacionesSQL(db)
    await setUltimoLotesSQL(db)
    await setUltimoRodeosSQL(db)
    await setUltimoTiposTratSQL(db)
    await setUltimoTratsSQL(db)
    await setUltimoNacimientosSQL(db)
    await setUltimoAnimalesElegirSQL(db)
    await setUltimoPesajesSQL(db)
}
//GET
export async function getPesajesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 12")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getTactosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 11")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getServiciosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 10")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getInseminacionesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 9")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getObservacionesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 8")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getLotesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 7")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getRodeosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 6")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getTiposTratSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 5")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getTratsSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 4")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getNacimientosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 3")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
//Este es mas dificil
export async function getAnimalesElegirSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 2")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
//SET
export async function addNewPesajeSQL(db,pesaje) {
    let pesajes = await getTactosSQL(db)
    let lista = pesajes.lista
    lista.push(pesaje)
    await setPesajesSQL(db,lista)
}
export async function setPesajesSQL(db,pesajes) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(pesajes)}' WHERE id = 12`)
}
export async function setUltimoPesajesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 12`)
}
export async function updateLocalPesajesSQL(db,pb,cabid) {
    const records = await pb.collection('pesaje').getFullList({
            sort: '-fecha',
            expand:"animal,animal.cab",
            filter:`animal.cab = '${cabid}'`
    });
    let pesajes = records
    await setPesajesSQL(db,pesajes)
    await setUltimoPesajesSQL(db)
    return pesajes
}
export async function updateLocalTactosSQL(db,pb,cabid) {
    const recordst = await pb.collection('tactos').getFullList({
        filter:`cab='${cabid}' && active=true`,
        sort: '-fecha',
        expand:"animal"
    });
    let tactos = recordst
    await setTactosSQL(db,tactos)
    await setUltimoTactosSQL(db)
    return tactos
}
export async function addNewTactoSQL(db,tacto) {
    let tactos = await getTactosSQL(db)
    let lista = tactos.lista
    lista.push(tacto)
    await setTactosSQL(db,lista)
}

export async function setTactosSQL(db,tactos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(tactos)}' WHERE id = 11`)
}
export async function setUltimoTactosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 11`)
}
export async function updateLocalServiciosSQL(db,pb,cabid) {
    const records = await pb.collection('servicios').getFullList({
        sort: '-fechadesde ',
        filter :`cab = '${cabid}' && active = true`,
        expand:"madre"
    });
    let servicios = records
    await setServiciosSQL(db,servicios)
    await setUltimoServiciosSQL(db)
    return servicios
}
export async function addNewServicioSQL(db,ser) {
    let servicios = await getTactosSQL(db)
    let lista = servicios.lista
    lista.push(ser)
    await setServiciosSQL(db,lista)
}
export async function setServiciosSQL(db,servicios) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(servicios)}' WHERE id = 10`)
}
export async function setUltimoServiciosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 10`)
}

export async function updateLocalInseminacionesSQL(db,pb,cabid) {
    const records = await pb.collection('inseminacion').getFullList({
        sort: '-fechainseminacion ',
        filter :`cab = '${cabid}' && active = true`,
        expand:"animal"
    });
    let inseminaciones = records
    await setInseminacionesSQL(db,inseminaciones)
    await setUltimoInseminacionesSQL(db)
    return inseminaciones
}
export async function addnewInseminacionSQL(db,ins) {
    let inseminaciones = await getTactosSQL(db)
    let lista = inseminaciones.lista
    lista.push(ins)
    await setInseminacionesSQL(db,lista)
}
export async function setInseminacionesSQL(db,inseminaciones) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(inseminaciones)}' WHERE id = 9`)
}
export async function setUltimoInseminacionesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 9`)
}

export async function updateLocalObservaciones(db,pb,cabid) {
    const records = await pb.collection('observaciones').getFullList({
        filter:`active=true && cab='${cabid}'`,
        expand:"animal",
        sort: '-fecha',
    });
    let observaciones = records
    await setObservacionesSQL(db,observaciones)
    await setUltimoObservacionesSQL(db)
    return observaciones
}
export async function addNewObservacionSQL(db,obs) {
    let observaciones = await getObservacionesSQL(db)
    let lista = observaciones.lista
    lista.push(obs)
    await setObservacionesSQL(db,lista)
}
export async function setObservacionesSQL(db,observaciones) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(observaciones)}' WHERE id = 8`)
}
export async function setUltimoObservacionesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 8`)
}
export async function updateLocalLotesSQL(db,pb,cabid) {
    const records = await pb.collection('lotes').getFullList({
        filter:`active = true && cab ~ '${cabid}'`,
        sort: 'nombre',
    });
    let lotes = records
    await setLotesSQL(db,lotes)
    await setUltimoLotesSQL(db)
    return lotes
}
export async function updateLoteSQL(db,id,lote) {
    let lotes = await getLotesSQL(db)
    let lista = lotes.lista
    let idx = lista.findIndex(a=>a.id==id)
    if(idx != -1){
        let total = lista[idx].total
        lista[idx] = lote
        lista[idx].total = total
        lista[idx].id = id
    }
    await setLotesSQL(db,lista)
}
export async function deleteLoteSQL(db,id) {
    let lotes = await getLotesSQL(db)
    let lista = lotes.lista
    let idx = lista.filter(a=>a.id!=id)
    await setLotesSQL(db,lista)
}
export async function addnewLoteSQL(db,lote) {
    let lotes = await getLotesSQL(db)
    let lista = observaciones.lista
    lista.push(lote)
    await setLotesSQL(db,lotes)
}
export async function setLotesSQL(db,lotes) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(lotes)}' WHERE id = 7`)
}
export async function setUltimoLotesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 7`)
}
export async function updateRodeoSQL(db,id,rodeo) {
    let rodeos = await getRodeosSQL(db)
    let lista = rodeos.lista
    let idx = lista.findIndex(a=>a.id==id)
    if(idx != -1){
        let total = lista[idx].total
        lista[idx] = rodeo
        lista[idx].total = total
        lista[idx].id = id
    }
    await setRodeosSQL(db,lista)
}
export async function deleteRodeoSQL(db,id) {
    let rodeos = await getRodeosSQL(db)
    let lista = rodeos.lista
    let idx = lista.filter(a=>a.id!=id)
    
    await setRodeosSQL(db,lista)
}
export async function updateLocalRodeosSQL(db,pb,cabid) {
    const records = await pb.collection('rodeos').getFullList({
        filter:`active = true && cab ~ '${cabid}'`,
        sort: 'nombre',
    });
    let rodeos = records
    await setRodeosSQL(db,rodeos)
    await setUltimoRodeosSQL(db)
    return rodeos
}
export async function addNewRodeoSQL(db,rodeo) {
    let rodeos = await getRodeosSQL(db)
    let lista = rodeos.lista
    lista.push(rodeo)
    await setRodeosSQL(db,rodeos)
}
export async function setRodeosSQL(db,rodeos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(rodeos)}' WHERE id = 6`)
}
export async function setUltimoRodeosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 6`)
}

export async function updateLocalTipoTratsSQL(db,pb,cabid) {
    const records = await pb.collection('tipotratamientos').getFullList({
        filter : `(cab='${cabid}' || generico = true) && active = true`,
        sort: '-created',
    });
    let tipotratamientos = records
    await setTiposTratSQL(db,tipotratamientos)
    await setUltimoTiposTratSQL(db)
    return tipotratamientos
}
export async function addNewTipoTratSQL(db,tipo) {
    let tipos = await getTiposTratSQL(db)
    let lista = tipos.lista
    lista.push(tipo)
    await setTiposTratSQL(db,rodeos)
}

export async function setTiposTratSQL(db,tipos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(tipos)}' WHERE id = 5`)
}
export async function setUltimoTiposTratSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 5`)
}
export async function updateLocalTratsSQL(db,pb,cabid) {
    //Lo que me hace ruido es cuando tenga miles de tratamientos, se va a poner lenta
    const records = await pb.collection('tratamientos').getFullList({
        filter : `cab='${cabid}' && active = true`,
        expand:"animal,tipo",
        sort: '-created',
    });
    let tratamientos = records
    await setTratsSQL(db,tratamientos)
    await setUltimoTratsSQL(db)
    return tratamientos
}
export async function addSomeNewTrataSQL(db,nuevostrats) {
    let trats = await getTratsSQL(db)
    let lista = trats.lista
    lista = lista.concat(nuevostrats)
    await setTratsSQL(db,lista)
}
export async function addNewTrataSQL(trat) {
    let trats = await getTratsSQL(db)
    let lista = trats.lista
    lista.push(trat)
    await setTratsSQL(db,lista)
}
export async function setTratsSQL(db,trats) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(trats)}' WHERE id = 4`)
}
export async function setUltimoTratsSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 4`)
}
export async function updateLocalNacimientosSQL(db,pb,cabid) {
    
    const recordsn = await pb.collection("nacimientosall").getFullList({
        filter:`cab='${cabid}'`,
        sort:"-fecha",
        expand:"madre,padre"
    })
    let nacimientos = recordsn
    await setNacimientosSQL(db,nacimientos)
    await setUltimoNacimientosSQL(db)
    return nacimientos
}
export async function addNewNacimientoSQL(db,nac) {
    let nacs = await getNacimientosSQL(db)
    let lista = nacs.lista
    lista.push(nac)
    await setNacimientosSQL(db,lista)
}
export async function setNacimientosSQL(db,nacs) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(nacs)}' WHERE id = 3`)
}
export async function setUltimoNacimientosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 3`)
}


export async function updateLocalAnimalesElegirSQL(db,pb,cabid) {
    
}
export async function setAnimalesElegirSQL(db,animales) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(animales)}' WHERE id = 2`)
}
export async function setUltimoAnimalesElegirSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 2`)
}