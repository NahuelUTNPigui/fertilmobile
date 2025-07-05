import { getAnimalSQLByID } from "$lib/stores/sqlite/dbanimales"
import { generarIDAleatorio } from "$lib/stringutil/lib"
//dEbo guardar
export async function guardarHistorialOffline(db,idanimal,user) {
    let a = await getAnimalSQLByID(db,idanimal)
    let esnuevolote = a.lote.split("_").length > 1
    let esnuevorodeo = a.rodeo.split("_").length > 1
    let camposprov = ""
    let vacio = true
    if(esnuevonac){
        vacio = false
        camposprov = "nacimientos"
    }
    if(esnuevolote){
        
        if(vacio){
            camposprov = "lote"
        }
        else{
            camposprov += ",lote"
        }
        vacio = false
    }
    if(esnuevorodeo){
        
        if(vacio){
            camposprov = "rodeo"
        }
        else{
            camposprov += ",rodeo"
        }
        
    }
    let histo = {
        animal:idanimal,
        caravana:a.caravana,
        user:user,
        active:true,
        delete:false,
        fechanacimiento:a.fechanacimiento,
        sexo:a.sexo,
        peso:a.peso,
        lote:a.lote,
        rodeo:a.rodeo,
        categoria:a.categoria,
        prenada:a.prenada,
        rp:a.rp,
        raza:a.raza,
        color:a.color,
    }
    let comando = {
        tipo:"add",
        coleccion:"historialanimales",
        data:{...histo},
        hora:Date.now(),
        prioridad:0,
        idprov:"nuevo_histo_"+generarIDAleatorio(),
        camposprov
    }
    return comando
}
//Debo guardar el historial en la lista de historiales
export async function guardarHistorial(pb,idanimal){
    let record = await pb.collection("animales").getOne(idanimal,{expand:"cab"})
    let histo ={
        animal:idanimal,
        caravana:record.caravana,
        user:record.expand.cab.user,
        active:true,
        delete:false,
        fechanacimiento:record.fechanacimiento,
        sexo:record.sexo,
        peso:record.peso,
        lote:record.lote,
        rodeo:record.rodeo,
        categoria:record.categoria,
        prenada:record.prenada,
        rp:record.rp
    }
    await pb.collection("historialanimales").create(histo)
}