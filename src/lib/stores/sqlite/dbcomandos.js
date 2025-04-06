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
export async function flushComandosSQL(db) {
    let rescoms  = await getComandosSQL(db)
    for(let i = 0;i<rescoms.lista.length;i++){
        alert(JSON.stringify(rescoms.lista[i]))
    }
    //await setComandosSQL(db,[])
    
}