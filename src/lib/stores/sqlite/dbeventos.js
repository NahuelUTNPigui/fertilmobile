import { loger } from "../logs/logs.svelte"
import { getEstablecimientosAsociadosSQL } from "./dbasociados"
import { getCabOffline } from "../capacitor/offlinecab"



export async function getTotalesEventosOnlineCab(pb,cabid) {
    let pesajes = 0

    let tactos = 0
    let servicios = 0
    let inseminaciones = 0
    let observaciones = 0

    let trats = 0
    let nacimientos = 0

    const resultPesajes = await pb.collection('pesaje').getList(1, 1, {
        expand: "animal",
        filter: `animal.cab = '${cabid}'`
    });
    const resultTactos = await pb.collection('tactos').getList(1, 1, {
        filter: `cab='${cabid}' && active=true`,
        //El cab es donde se hace el tacto
        //El animal en el futuro puede tener un cab diferente
        
    });
    const resultServicios = await pb.collection('servicios').getList(1, 1, {
        filter: `cab = '${cabid}' && active = true`,
        
    });
    const resultInseminaciones = await pb.collection('inseminacion').getList(1, 1, {
        filter: `cab = '${cabid}' && active = true`,
        
    });
    const resultObservaciones = await pb.collection('observaciones').getList(1, 1, {
        filter: `active=true && cab='${cabid}'`,
        
    });
    const resultTratamientos = await pb.collection('tratamientos').getList(1, 1, {
        filter: `cab='${cabid}' && active = true`,
        
    });
    const resultNacimientos = await pb.collection('nacimientosall').getList(1, 1, {
        filter: `madre.cab='${cabid}'`,
        expand: "madre"
    });
    pesajes = resultPesajes.totalItems
    tactos = resultTactos.totalItems
    servicios = resultServicios.totalItems
    inseminaciones = resultInseminaciones.totalItems
    observaciones = resultObservaciones.totalItems
    trats = resultTratamientos.totalItems

    nacimientos = resultNacimientos.totalItems

    let totales = { 
        pesajes, 
        tactos, 
        servicios, 
        inseminaciones, 
        observaciones, 
        tratamientos: trats, 
        nacimientos 
    }

    return totales;
}
//sin animales, ni lotes, ni rodeos
export async function getTotalesEventosOnline(pb, userid) {

    let pesajes = 0

    let tactos = 0
    let servicios = 0
    let inseminaciones = 0
    let observaciones = 0

    let trats = 0
    let nacimientos = 0

    const resultPesajes = await pb.collection('pesaje').getList(1, 1, {
        expand: "animal,animal.cab",
        filter: `animal.cab.user = '${userid}'`
    });
    const resultTactos = await pb.collection('tactos').getList(1, 1, {
        filter: `cab.user='${userid}' && active=true`,
        //El cab es donde se hace el tacto
        //El animal en el futuro puede tener un cab diferente
        expand: "animal,cab"
    });
    const resultServicios = await pb.collection('servicios').getList(1, 1, {
        filter: `cab.user = '${userid}' && active = true`,
        expand: "madre,cab"
    });
    const resultInseminaciones = await pb.collection('inseminacion').getList(1, 1, {
        filter: `cab.user = '${userid}' && active = true`,
        expand: "animal,cab"
    });
    const resultObservaciones = await pb.collection('observaciones').getList(1, 1, {
        filter: `active=true && cab.user='${userid}'`,
        expand: "animal,cab"
    });

    const resultTratamientos = await pb.collection('tratamientos').getList(1, 1, {
        filter: `cab.user='${userid}' && active = true`,
        expand: "animal,tipo,cab"
    });
    const resultNacimientos = await pb.collection('nacimientosall').getList(1, 1, {
        filter: `cab.user='${userid}'`,
        expand: "madre,padre,cab"
    });

    pesajes = resultPesajes.totalItems
    tactos = resultTactos.totalItems
    servicios = resultServicios.totalItems
    inseminaciones = resultInseminaciones.totalItems
    observaciones = resultObservaciones.totalItems
    trats = resultTratamientos.totalItems

    nacimientos = resultNacimientos.totalItems

    let totales = { 
        pesajes, 
        tactos, 
        servicios, 
        inseminaciones, 
        observaciones, 
        tratamientos: trats, 
        nacimientos 
    }

    return totales;
}

//Eficientizar update
export async function updateLocalEventosSQLUser(db, pb, userid) {

    let pesajes = await updateLocalPesajesSQLUser(db, pb, userid)

    let tactos = await updateLocalTactosSQLUser(db, pb, userid)

    let servicios = await updateLocalServiciosSQLUser(db, pb, userid)

    let inseminaciones = await updateLocalInseminacionesSQLUser(db, pb, userid)

    let observaciones = await updateLocalObservacionesSQLUser(db, pb, userid)

    let lotes = await updateLocalLotesSQLUser(db, pb, userid)

    let rodeos = await updateLocalRodeosSQLUser(db, pb, userid)

    let tipostrat = await updateLocalTiposTratSQLUser(db, pb, userid)

    let trats = await updateLocalTratsSQLUser(db, pb, userid)

    let nacimientos = await updateLocalNacimientosSQLUser(db, pb, userid)
    return {
        pesajes,
        tactos,
        servicios,
        inseminaciones,
        observaciones,
        lotes,
        rodeos,
        tipostrat,
        trats,
        nacimientos
    };
}
export async function updateLocalEventosSQL(db, pb, cabid) {
    await updateLocalPesajesSQL(db, pb, cabid)
    await updateLocalTactosSQL(db, pb, cabid)
    await updateLocalServiciosSQL(db, pb, cabid)
    await updateLocalInseminacionesSQL(db, pb, cabid)
    await updateLocalObservaciones(db, pb, cabid)
    await updateLocalLotesSQL(db, pb, cabid)
    await updateLocalRodeosSQL(db, pb, cabid)
    await updateLocalTipoTratsSQL(db, pb, cabid)
    await updateLocalTratsSQL(db, pb, cabid)
    await updateLocalNacimientosSQL(db, pb, cabid)
    await updateLocalAnimalesElegirSQL(db, pb, cabid)
    await updateLocalObservaciones(db, pb, cabid)

}

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
    return { tactos, servicios, inseminaciones, observaciones, lotes, rodeos, tipostrat, trats, nacimientos, animaleselegir, pesajes };
}
export async function setEventosSQL(db, tactos, servicios, inseminaciones, observaciones, lotes, rodeos, tipostrat, trats, nacimientos, animaleselegir, pesajes) {
    await setTactosSQL(db, tactos)
    await setServiciosSQL(db, servicios)
    await setInseminacionesSQL(db, inseminaciones)
    await setObservacionesSQL(db, observaciones)
    await setLotesSQL(db, lotes)
    await setRodeosSQL(db, rodeos)
    await setTiposTratSQL(db, tipostrat)
    await setTratsSQL(db, trats)
    await setNacimientosSQL(db, nacimientos)
    await setAnimalesElegirSQL(db, animaleselegir)
    await setPesajesSQL(db, pesajes)
}
export async function setUltimoEventosSQL(db) {
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
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function getTactosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 11")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function getServiciosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 10")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function getInseminacionesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 9")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function getObservacionesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 8")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}

export async function getLotesSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 7")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function getRodeosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 6")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}

export async function getTiposTratSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 5")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function getTratsSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 4")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
export async function getUltimoNacimientosSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 3")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
export async function getNacimientosSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 3")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
//Este es mas dificil, es que debo usar animalestacto en getAnimales
export async function getAnimalesElegirSQL(db) {
    let lista_json = await db.query("select id,lista,nombre,ultimo from Colecciones where id = 2")
    let fila = lista_json.values[0]
    let lista = JSON.parse(fila.lista)
    let coleccion = { ...fila }
    coleccion.lista = lista
    return coleccion
}
//SET
//PESAJES
export async function addNewPesajeSQL(db, pesaje) {
    let pesajes = await getPesajesSQL(db)
    let lista = pesajes.lista
    lista.push(pesaje)
    await setPesajesSQL(db, lista)
}
export async function setPesajesSQL(db, pesajes) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(pesajes)}' WHERE id = 12`)
}
export async function setUltimoPesajesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 12`)
}
export async function updateLocalPesajesSQLUser(db, pb, userid) {
    const records = await pb.collection('pesaje').getFullList({
        sort: '-fecha',
        expand: "animal,animal.cab",
        filter: `animal.cab.user = '${userid}'`
    });
    let pesajes = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        let records_asoc = await pb.collection('pesaje').getFullList({
            sort: '-fecha',
            expand: "animal,animal.cab",
            filter: `animal.cab = '${asociados[i]}'`
        });
        pesajes = pesajes.concat(records_asoc)
    }

    //Fin Asociados
    await setPesajesSQL(db, pesajes)
    await setUltimoPesajesSQL(db)
    return pesajes
}
export async function updateLocalPesajesSQL(db, pb, cabid) {
    const records = await pb.collection('pesaje').getFullList({
        sort: '-fecha',
        expand: "animal,animal.cab",
        filter: `animal.cab = '${cabid}'`
    });
    let pesajes = records
    await setPesajesSQL(db, pesajes)
    await setUltimoPesajesSQL(db)
    return pesajes
}
export async function getUltimoPesajeSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 12")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
//TACTOS
export async function updateLocalTactosSQLUser(db, pb, userid) {
    const recordst = await pb.collection('tactos').getFullList({
        filter: `cab.user='${userid}' && active=true`,
        sort: '-fecha',
        //El cab es donde se hace el tacto
        //El animal en el futuro puede tener un cab diferente
        expand: "animal,cab"
    });

    let tactos = recordst
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let records_asoc = await pb.collection('tactos').getFullList({
            filter: `cab='${asociados[i]}' && active=true`,
            sort: '-fecha',
            //El cab es donde se hace el tacto
            //El animal en el futuro puede tener un cab diferente
            expand: "animal,cab"
        });
        tactos = tactos.concat(records_asoc)
    }

    //Fin Asociados
    await setTactosSQL(db, tactos)
    await setUltimoTactosSQL(db)
    return tactos
}
export async function updateLocalTactosSQL(db, pb, cabid) {
    const recordst = await pb.collection('tactos').getFullList({
        filter: `cab='${cabid}' && active=true`,
        sort: '-fecha',
        expand: "animal"
    });
    let tactos = recordst
    await setTactosSQL(db, tactos)
    await setUltimoTactosSQL(db)
    return tactos
}
export async function addNewTactoSQL(db, tacto) {
    let tactos = await getTactosSQL(db)
    let lista = tactos.lista
    lista.push(tacto)
    await setTactosSQL(db, lista)
}

export async function setTactosSQL(db, tactos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(tactos)}' WHERE id = 11`)
}
export async function setUltimoTactosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 11`)
}
export async function getUltimoTactosSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 11")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
//SERVICIOS
export async function updateLocalServiciosSQLUser(db, pb, userid) {
    const records = await pb.collection('servicios').getFullList({
        sort: '-fechadesde ',
        filter: `cab.user = '${userid}' && active = true`,
        expand: "madre,cab"
    });
    let servicios = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let record_asoc = await pb.collection('servicios').getFullList({
            sort: '-fechadesde ',
            filter: `cab = '${asociados[i]}' && active = true`,
            expand: "madre,cab"
        });
        servicios = servicios.concat(record_asoc)
    }

    //Fin Asociados
    await setServiciosSQL(db, servicios)
    await setUltimoServiciosSQL(db)
    return servicios
}
export async function updateLocalServiciosSQL(db, pb, cabid) {
    const records = await pb.collection('servicios').getFullList({
        sort: '-fechadesde ',
        filter: `cab = '${cabid}' && active = true`,
        expand: "madre"
    });
    let servicios = records
    await setServiciosSQL(db, servicios)
    await setUltimoServiciosSQL(db)
    return servicios
}
export async function addNewServicioSQL(db, ser) {
    let servicios = await getServiciosSQL(db)
    let lista = servicios.lista
    lista.push(ser)
    
    await setServiciosSQL(db, lista)
}
export async function setServiciosSQL(db, servicios) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(servicios)}' WHERE id = 10`)
}
export async function setUltimoServiciosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 10`)
}
export async function getUltimoServiciosSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 10")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
//INSEMINACIONES va a usar servicios para el internet
export async function updateLocalInseminacionesSQLUser(db, pb, userid) {

    const records = await pb.collection('inseminacion').getFullList({
        sort: '-fechainseminacion ',
        filter: `cab.user = '${userid}' && active = true`,
        expand: "animal,cab"
    });
    let inseminaciones = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let record_asoc = await pb.collection('inseminacion').getFullList({
            sort: '-fechainseminacion ',
            filter: `cab = '${asociados[i]}' && active = true`,
            expand: "animal,cab"
        });
        inseminaciones = inseminaciones.concat(record_asoc)
    }

    //Fin Asociados
    await setInseminacionesSQL(db, inseminaciones)
    await setUltimoInseminacionesSQL(db)
    return inseminaciones
}
export async function updateLocalInseminacionesSQL(db, pb, cabid) {
    const records = await pb.collection('inseminacion').getFullList({
        sort: '-fechainseminacion ',
        filter: `cab = '${cabid}' && active = true`,
        expand: "animal"
    });
    let inseminaciones = records
    await setInseminacionesSQL(db, inseminaciones)
    await setUltimoInseminacionesSQL(db)
    return inseminaciones
}
export async function addnewInseminacionSQL(db, ins) {
    let inseminaciones = await getInseminacionesSQL(db)
    let lista = inseminaciones.lista
    lista.push(ins)
    await setInseminacionesSQL(db, lista)
}
export async function setInseminacionesSQL(db, inseminaciones) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(inseminaciones)}' WHERE id = 9`)
}
export async function setUltimoInseminacionesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 9`)
}
//Observaciones
export async function updateLocalObservacionesSQLUser(db, pb, userid) {
    const records = await pb.collection('observaciones').getFullList({
        filter: `active=true && cab.user='${userid}'`,
        expand: "animal,cab",
        sort: '-fecha'
    })
    let observaciones = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let record_asoc = await pb.collection('observaciones').getFullList({
            filter: `active=true && cab='${asociados[i]}'`,
            expand: "animal,cab",
            sort: '-fecha'
        })
        observaciones = observaciones.concat(record_asoc)
    }

    //Fin Asociados
    await setObservacionesSQL(db, observaciones)
    await setUltimoObservacionesSQL(db)
    return observaciones
}
export async function updateLocalObservaciones(db, pb, cabid) {
    const records = await pb.collection('observaciones').getFullList({
        filter: `active=true && cab='${cabid}'`,
        expand: "animal",
        sort: '-fecha',
    });
    let observaciones = records
    await setObservacionesSQL(db, observaciones)
    await setUltimoObservacionesSQL(db)
    return observaciones
}
export async function addNewObservacionSQL(db, obs) {
    let observaciones = await getObservacionesSQL(db)
    let lista = observaciones.lista
    lista.push(obs)
    await setObservacionesSQL(db, lista)
}
export async function setObservacionesSQL(db, observaciones) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(observaciones)}' WHERE id = 8`)
}
export async function setUltimoObservacionesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 8`)
}
export async function getUltimoObservacionesSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 8")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
//LOTES

export async function updateLocalLotesSQLUser(db, pb, userid) {
    const records = await pb.collection('lotes').getFullList({
        filter: `cab.user='${userid}'`,
        sort: 'nombre',
        expand: "cab"
    });
    let lotes = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let records_asoc = await pb.collection('lotes').getFullList({
            filter: `cab='${asociados[i]}'`,
            sort: 'nombre',
            expand: "cab"
        });
        lotes = lotes.concat(records_asoc)
    }

    //Fin Asociados
    await setLotesSQL(db, lotes)
    await setUltimoLotesSQL(db)
    return lotes
}
export async function getUpdateLocalLotesSQLUserCab(db, pb, userid, cabid) {
    let lotes = await updateLocalLotesSQLUser(db, pb, userid)
    lotes = lotes.filter(l => l.cab == cabid)
    return lotes
}
export async function updateLocalLotesSQL(db, pb, cabid) {
    const records = await pb.collection('lotes').getFullList({
        filter: `active = true && cab ~ '${cabid}'`,
        sort: 'nombre',
    });
    let lotes = records
    await setLotesSQL(db, lotes)
    await setUltimoLotesSQL(db)
    return lotes
}
export async function updateLoteSQL(db, id, lote) {
    let lotes = await getLotesSQL(db)
    let lista = lotes.lista
    let idx = lista.findIndex(a => a.id == id)
    if (idx != -1) {
        let total = lista[idx].total
        lista[idx] = lote
        lista[idx].total = total
        lista[idx].id = id
    }
    await setLotesSQL(db, lista)
}
export async function deleteLoteSQL(db, id) {
    let lotes = await getLotesSQL(db)
    let lista = lotes.lista
    let idx = lista.filter(a => a.id != id)
    await setLotesSQL(db, lista)
}
export async function addnewLoteSQL(db, lote) {
    let lotes = await getLotesSQL(db)
    let lista = observaciones.lista
    lista.push(lote)
    await setLotesSQL(db, lotes)
}
export async function setLotesSQL(db, lotes) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(lotes)}' WHERE id = 7`)
}
export async function setUltimoLotesSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 7`)
}
export async function getUltimoLotesSQL(db) {
    let ultimo_json = await db.query("select id,ultimo from Colecciones where id = 7")
    let ultimo = ultimo_json.values[0]
    return ultimo
}
//RODEOS
export async function updateLocalRodeosSQLUser(db, pb, userid) {
    const records = await pb.collection('rodeos').getFullList({
        filter: `cab.user='${userid}'`,
        sort: 'nombre',
        expand: "cab"
    });
    let rodeos = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let records_asoc = await pb.collection('rodeos').getFullList({
            filter: `cab='${asociados[i]}'`,
            sort: 'nombre',
            expand: "cab"
        });
        rodeos = rodeos.concat(records_asoc)

    }

    //Fin Asociados
    await setRodeosSQL(db, rodeos)
    await setUltimoRodeosSQL(db)
    return rodeos
}
export async function getUpdateLocalRodeosSQLUserCab(db, pb, userid, cabid) {
    let rodeos = await updateLocalRodeosSQLUser(db, pb, userid)
    rodeos = rodeos.filter(r => r.cab == cabid)
    return rodeos
}
export async function updateRodeoSQL(db, id, rodeo) {
    let rodeos = await getRodeosSQL(db)
    let lista = rodeos.lista
    let idx = lista.findIndex(a => a.id == id)
    if (idx != -1) {
        let total = lista[idx].total
        lista[idx] = rodeo
        lista[idx].total = total
        lista[idx].id = id
    }
    await setRodeosSQL(db, lista)
}
export async function deleteRodeoSQL(db, id) {
    let rodeos = await getRodeosSQL(db)
    let lista = rodeos.lista
    let idx = lista.filter(a => a.id != id)

    await setRodeosSQL(db, lista)
}
export async function updateLocalRodeosSQL(db, pb, cabid) {
    const records = await pb.collection('rodeos').getFullList({
        filter: `active = true && cab ~ '${cabid}'`,
        sort: 'nombre',
    });
    let rodeos = records
    await setRodeosSQL(db, rodeos)
    await setUltimoRodeosSQL(db)
    return rodeos
}
export async function addNewRodeoSQL(db, rodeo) {
    let rodeos = await getRodeosSQL(db)
    let lista = rodeos.lista
    lista.push(rodeo)
    await setRodeosSQL(db, rodeos)
}
export async function setRodeosSQL(db, rodeos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(rodeos)}' WHERE id = 6`)
}
export async function setUltimoRodeosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 6`)
}
export async function getUltimoRodeosSQL(db) {
    let fila_json = await db.query("select id,ultimo from Colecciones where id = 6")
    let fila = fila_json.values[0]
    return fila
}
// LOTES Y RODEOS
export async function getUpdateLocalRodeosLotesSQLUser(db, pb, usuarioid, cabid) {
    let lotes = await getUpdateLocalLotesSQLUserCab(db, pb, usuarioid, cabid)
    let rodeos = await getUpdateLocalRodeosSQLUserCab(db, pb, usuarioid, cabid)
    return {
        lotes, rodeos
    };
}
export async function getLotesRodeosSQL(db, cabid) {
    let resrodeos = await getRodeosSQL(db)
    let reslotes = await getLotesSQL(db)
    
    let lotes = reslotes.lista.filter(l => l.cab == cabid)
    let rodeos = resrodeos.lista.filter(r => r.cab == cabid)
    return {
        lotes, rodeos
    };
}
export async function setUltimoRodeosLotesSQL(db) {
    await setUltimoLotesSQL(db)
    await setUltimoRodeosSQL(db)
}
export async function getTotalesRodeosLotesSQL(pb,cabid){
    const resultLotes = await pb.collection('lotes').getList(1,1,{
        filter: `active = true && cab ~ '${cabid}'`
    });
    const resultRodeos = await pb.collection('rodeos').getList(1,1,{
        filter: `active = true && cab ~ '${cabid}'`
    });
    let lotes = resultLotes.totalItems
    let rodeos = resultRodeos.totalItems
    return {lotes,rodeos}
}
//TIPOS DE TRATAMIENTOS
export async function updateLocalTiposTratSQLUser(db, pb, userid) {
    const genericos = await pb.collection('tipotratamientos').getFullList({
        filter: `(generico = true) && active = true`,
        sort: '-created',
    });
    let tipotratamientos = genericos
    const records = await pb.collection('tipotratamientos').getFullList({
        filter: `(cab.user='${userid}') && active = true`,
        sort: '-created',
        expand: "cab"
    });
    tipotratamientos = tipotratamientos.concat(records)
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let records_asoc = await pb.collection('tipotratamientos').getFullList({
            filter: `(cab='${asociados[i]}') && active = true`,
            sort: '-created',
            expand: "cab"
        });
        tipotratamientos = tipotratamientos.concat(records_asoc)
    }

    //Fin Asociados
    await setTiposTratSQL(db, tipotratamientos)
    await setUltimoTiposTratSQL(db)
    return tipotratamientos
}
export async function updateLocalTipoTratsSQL(db, pb, cabid) {
    const records = await pb.collection('tipotratamientos').getFullList({
        filter: `(cab='${cabid}' || generico = true) && active = true`,
        sort: '-created',
    });
    let tipotratamientos = records
    await setTiposTratSQL(db, tipotratamientos)
    await setUltimoTiposTratSQL(db)
    return tipotratamientos
}
export async function addNewTipoTratSQL(db, tipo) {
    let tipos = await getTiposTratSQL(db)
    let lista = tipos.lista
    lista.push(tipo)
    await setTiposTratSQL(db, rodeos)
}

export async function setTiposTratSQL(db, tipos) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(tipos)}' WHERE id = 5`)
}
export async function setUltimoTiposTratSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 5`)
}
//TRATAMIENTOS
export async function updateLocalTratsSQLUser(db, pb, userid) {
    const records = await pb.collection('tratamientos').getFullList({
        filter: `cab.user='${userid}' && active = true`,
        expand: "animal,tipo,cab",
        sort: '-created',
    });
    let tratamientos = records
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let records_asoc = await pb.collection('tratamientos').getFullList({
            filter: `cab='${asociados[i]}' && active = true`,
            expand: "animal,tipo,cab",
            sort: '-created',
        });
        tratamientos = tratamientos.concat(records_asoc)
    }

    //Fin Asociados
    await setTratsSQL(db, tratamientos)
    await setUltimoTratsSQL(db)
    return tratamientos
}
export async function updateLocalTratsSQL(db, pb, cabid) {
    //Lo que me hace ruido es cuando tenga miles de tratamientos, se va a poner lenta
    const records = await pb.collection('tratamientos').getFullList({
        filter: `cab='${cabid}' && active = true`,
        expand: "animal,tipo",
        sort: '-created',
    });
    let tratamientos = records
    await setTratsSQL(db, tratamientos)
    await setUltimoTratsSQL(db)
    return tratamientos
}
export async function addSomeNewTrataSQL(db, nuevostrats) {
    let trats = await getTratsSQL(db)
    let lista = trats.lista
    lista = lista.concat(nuevostrats)
    await setTratsSQL(db, lista)
}
export async function addNewTrataSQL(db, trat) {
    let trats = await getTratsSQL(db)
    let lista = trats.lista
    lista.push(trat)
    await setTratsSQL(db, lista)
}
export async function setTratsSQL(db, trats) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(trats)}' WHERE id = 4`)
}
export async function setUltimoTratsSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 4`)
}
export async function getUltimoTratsSQL(db) {
    let fila_json = await db.query("select id,ultimo from Colecciones where id = 4")
    let fila = fila_json.values[0]
    return fila
}
//NACIMIENTOS
export async function updateLocalNacimientosSQLUser(db, pb, userid) {
    const recordsn = await pb.collection("nacimientosall").getFullList({
        filter: `cab.user='${userid}'`,
        sort: "-fecha",
        expand: "madre,padre,cab"
    })
    let nacimientos = recordsn
    //Asociados
    let resasociados = await getEstablecimientosAsociadosSQL(db)
    let asociados = resasociados.lista
    let caboff = await getCabOffline()

    if (caboff.colaborador) {
        if (!asociados.includes(caboff.id)) {
            asociados.push(caboff.id)
        }
    }

    for (let i = 0; i < asociados.length; i++) {
        //asociados[i]
        let recordsn_asoc = await pb.collection("nacimientosall").getFullList({
            filter: `cab='${asociados[i]}'`,
            sort: "-fecha",
            expand: "madre,padre,cab"
        })
        nacimientos = nacimientos.concat(recordsn_asoc)
    }

    //Fin Asociados
    await setNacimientosSQL(db, nacimientos)
    await setUltimoNacimientosSQL(db)
    return nacimientos
}
export async function updateLocalNacimientosSQL(db, pb, cabid) {

    const recordsn = await pb.collection("nacimientosall").getFullList({
        filter: `cab='${cabid}'`,
        sort: "-fecha",
        expand: "madre,padre"
    })
    let nacimientos = recordsn
    await setNacimientosSQL(db, nacimientos)
    await setUltimoNacimientosSQL(db)
    return nacimientos
}
export async function editarNacimientoSQL(db, nac, id) {
    let nacs = await getNacimientosSQL(db)
    let lista = nacs.lista
    let n_idx = lista.findIndex(n => n.id == id)
    if (n_idx != -1) {
        lista[n_idx] = {
            ...lista[n_idx],
            ...nac
        }
        await setNacimientosSQL(db, lista)
    }
}
export async function addNewNacimientoSQL(db, nac) {
    let nacs = await getNacimientosSQL(db)
    let lista = nacs.lista
    lista.push(nac)
    await setNacimientosSQL(db, lista)
}
export async function setNacimientosSQL(db, nacs) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(nacs)}' WHERE id = 3`)
}
export async function setUltimoNacimientosSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 3`)
}

//NUnca se usa
export async function updateLocalAnimalesElegirSQL(db, pb, cabid) {

}
export async function setAnimalesElegirSQL(db, animales) {
    await db.run(`UPDATE Colecciones SET lista = '${JSON.stringify(animales)}' WHERE id = 2`)
}
export async function setUltimoAnimalesElegirSQL(db) {
    await db.run(`UPDATE Colecciones SET ultimo = ${Date.now()} WHERE id = 2`)
}