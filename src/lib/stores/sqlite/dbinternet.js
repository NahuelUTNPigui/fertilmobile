export async function getInternet(db) {
    let rowsinternet = await db.query("select id,internet,ultimo from Internet where id = 1")
    let internet = rowsinternet.values[0]
    return internet
}
export async function setInternet(db,internet,ultimo) {
    await db.run(`UPDATE Internet SET internet = ${internet},ultimo = ${ultimo} WHERE id = 1`)
}