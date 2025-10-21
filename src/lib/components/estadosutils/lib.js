import estados from "$lib/stores/estados";
export function getEstadoNombre(id){
    let es = estados.filter(est=>est.id==id)
    if(es.length>0){
        return es[0].nombre
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