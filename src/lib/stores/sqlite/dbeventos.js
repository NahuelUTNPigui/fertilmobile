export async function getEventos(db) {
    let tactos = await getTactos(db)
    let servicios = await getServicios(db)
    let inseminaciones = await getInseminaciones(db)
    let observaciones = await getObservaciones(db)
    let lotes = await getLotes(db)
    let rodeos = await getRodeos(db)
    let tipostrat = await getTiposTrat(db)
    let trats = await getTrats(db)
    let nacimientos = await getNacimientos(db)
    let animaleselegir = await getAnimalesElegir(db)
    let pesajes = await getPesajes(db)
    return {tactos,servicios,inseminaciones,observaciones,lotes,rodeos,tipostrat,trats,nacimientos,animaleselegir,pesajes};
}
export async function setEventos(db,tactos,servicios,inseminaciones,observaciones,lotes,rodeos,tipostrat,trats,nacimientos,animaleselegir,pesajes) {
    await setTactos(db,tactos)
    await setServicios(db,servicios)
    await setInseminaciones(db,inseminaciones)
    await setObservaciones(db,observaciones)
    await setLotes(db,lotes)
    await setRodeos(db,rodeos)
    await setTiposTrat(db,tipostrat)
    await setTrats(db,trats)
    await setNacimientos(db,nacimientos)
    await setAnimalesElegir(db,animaleselegir)
    await setPesajes(db,pesajes)
}
export async function setUltimoEventos(db){
    await setUltimoTactos(db)
    await setUltimoServicios(db)
    await setUltimoInseminaciones(db)
    await setUltimoObservaciones(db)
    await setUltimoLotes(db)
    await setUltimoRodeos(db)
    await setUltimoTiposTrat(db)
    await setUltimoTrats(db)
    await setUltimoNacimientos(db)
    await setUltimoAnimalesElegir(db)
    await setUltimoPesajes(db)
}
//GET
export async function getPesajes(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 12")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}



export async function getTactos(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 11")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getServicios(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 10")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getInseminaciones(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 9")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getObservaciones(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 8")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getLotes(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 7")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getRodeos(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 6")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getTiposTrat(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 5")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getTrats(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 4")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
export async function getNacimientos(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 3")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
//Este es mas dificil
export async function getAnimalesElegir(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 2")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = {...fila}
    coleccion.lista = lista
    return coleccion
}
//SET
export async function setPesajes(db,pesajes) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(pesajes)}' WHERE id = 12`)
}
export async function setUltimoPesajes(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 12`)
}
export async function addNewTacto(db,tacto) {
    let lista = await getTactos(db)
    lista.push(tacto)
    setTactos(db,lista)
}
export async function setTactos(db,tactos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(tactos)}' WHERE id = 11`)
}
export async function setUltimoTactos(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 11`)
}

export async function setServicios(db,servicios) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(servicios)}' WHERE id = 10`)
}
export async function setUltimoServicios(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 10`)
}

export async function setInseminaciones(db,inseminaciones) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(inseminaciones)}' WHERE id = 9`)
}
export async function setUltimoInseminaciones(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 9`)
}

export async function setObservaciones(db,observaciones) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(observaciones)}' WHERE id = 8`)
}
export async function setUltimoObservaciones(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 8`)
}

export async function setLotes(db,lotes) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(lotes)}' WHERE id = 7`)
}
export async function setUltimoLotes(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 7`)
}

export async function setRodeos(db,rodeos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(rodeos)}' WHERE id = 6`)
}
export async function setUltimoRodeos(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 6`)
}

export async function setTiposTrat(db,tipos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(tipos)}' WHERE id = 5`)
}
export async function setUltimoTiposTrat(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 5`)
}

export async function setTrats(db,trats) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(trats)}' WHERE id = 4`)
}
export async function setUltimoTrats(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 4`)
}

export async function setNacimientos(db,nacs) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(nacs)}' WHERE id = 3`)
}
export async function setUltimoNacimientos(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 3`)
}

export async function setAnimalesElegir(db,animales) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(animales)}' WHERE id = 2`)
}
export async function setUltimoAnimalesElegir(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 2`)
}