//Este esta bien?
export async function getEsblecimientoSQL(db) {
    let result = await db.query("select id,valores from Establecimiento where id=1")
    let fila = result.values[0]
    let establecimiento = JSON.parse(fila.valores)
    return establecimiento
}
//Esta aca el problema
export async function setEstablecimientoSQL(db,establecimiento) {
    let result = await db.query("select id,valores from Establecimiento where id=1")
    
    let fila = result.values[0]
    let localestablecimiento = JSON.parse(fila.valores)
    localestablecimiento = {...localestablecimiento,...establecimiento}
    await db.run(`UPDATE Establecimiento SET valores = '${JSON.stringify(localestablecimiento)}' WHERE id = 1`)
}

export async function updateLocalEstablecimientoSQL(db,pb,idcab) {
    const record = await pb.collection('cabs').getFirstListItem(`id='${idcab}' && active=true`, {});
    await setEstablecimientoSQL(db,record)
    return record
}