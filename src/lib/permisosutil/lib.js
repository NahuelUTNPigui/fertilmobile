export function getPermisosList(per){
    let userpermisos = [false,false,false,false,false,false]
    if(per.length!=0){
        for(let i = 0;i<per.length;i++){
            let idx = parseInt(per[i], 10)
            userpermisos[idx] = true
        }
    }
    return userpermisos
}