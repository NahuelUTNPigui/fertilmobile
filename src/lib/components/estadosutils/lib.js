import estados from "$lib/stores/estados";
export function getEstadoNombre(id){
    let e = estados.filter(est=>est.id==id)[0]
    if(e){
        return e.nombre
    }
    else{
        return ""
    }
}
export function getEstadoColor(id){
    let e = estados.filter(est=>est.id==id)[0]
    if(e){
        return e.color
    }
    else{
        return "neutral"
    }
}