import { 
    setUltimoAnimalesSQL,setUltimoHistorialAnimalesSQL 
} from "./dbanimales";
import { setUltimoEventosSQL } from "./dbeventos";

export async function getInternetSQL(db) {
    let rowsinternet = await db.query("select id,internet,ultimo from Internet where id = 1")
    
    let internet = rowsinternet.values[0]
    return internet
}
export async function setUltimosSQL(db) {
    await setUltimoEventosSQL(db)
    await setUltimoAnimalesSQL(db)
    await setUltimoHistorialAnimalesSQL(db) 
}
//Esto registra si tuve o no internet nada mas
export async function setInternetSQL(db,internet,ultimo) {
    await db.run(`UPDATE Internet SET internet = ${internet},ultimo = ${ultimo} WHERE id = 1`)
}