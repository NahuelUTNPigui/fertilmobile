export async function getComandos(db) {
    let rowcommand = await db.query("select id,lista from Comandos where id = 1")
    
    let comands = rowcommand.values[0]
    let lista = JSON.parse(comands.lista)
    comands.lista = lista
    return comands
}
export async function setComandos(db,lista) {
    await db.run(`UPDATE Comandos SET lista = '${JSON.stringify(lista)}' WHERE id = 1`)
}