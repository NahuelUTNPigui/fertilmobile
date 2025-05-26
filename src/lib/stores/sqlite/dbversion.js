export function  versiones(){  
    return[
        {id: 1,version:1, description: 'Version inicial'}
    ];
}
export function lastVersion(){
    let vs = versiones()
    return vs[vs.length-1]
}
export async function getDBVersion(db) {
    let lista_json = await db.query("select id,description from Version")
    let version = lista_json.values[0]
    return version
}
export async function setDBVersion(db,version) {
    await db.run(`UPDATE Version SET description = '${version.description}' ,version =${version.id} WHERE id = 1`)  
}