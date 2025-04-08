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
async function addComando() {
    let id = c.idprov[i]
    let accion = c.tipo
    let campos = c.camposprov.split(",")
    let coleccion = c.coleccion
    let data = c.data
    if(coleccion=="lote"){

    }
    else if(coleccion=="rodeo"){

    }
    else if(coleccion == "nacimiento"){

    }
    else{
        
    }
}
async function modComando() {
    
}
async function delComando() {
    
}
export async function flushComandosSQL(db) {
    let rescoms  = await getComandosSQL(db)
    let listacomandos = []
    let tablatipo = {}
    let tablalote = {}
    let tablarodeo = {}
    let tablanacimiento = {}
    let tablaanimal = {}
    for(let i = 0;i<rescoms.lista.length;i++){
        let c = rescoms.lista[i]
        listacomandos.push(c)
    }

    listacomandos.sort((c1,c2)=>c1.prioridad<c2.prioridad?-1:1)
    //Por is algun comando requiere de batch
    let batch =[]
    for(let i = 0;i<listacomandos.length;i++){
        let c = listacomandos[i]
        let id = c.idprov[i]
        let accion = c.tipo
        let campos = c.camposprov.split(",")
        let coleccion = c.coleccion
        let data = c.data
        if(accion=="add"){
            await addComando(c)
        }
        else if(accion=="update"){
            await modComando(c)
        }
        else if(accion=="delete"){
            await delComando(c)
        }
    }
    //await setComandosSQL(db,[])
    
}

