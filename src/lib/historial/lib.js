import { getAnimalSQLByID } from "$lib/stores/sqlite/dbanimales"
//dEbo guardar
export async function guardarHistorialOffline(db,idanimal,user) {
    let a = await getAnimalSQLByID(db,idanimal)
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
        rp:record.rp,
        raza:record.raza,
        color:record.color,
    }
    let comando = {
        tipo:"add",
        coleccion:"historialanimales",
        data:{...histo},
        hora:Date.now(),
        prioridad:0,
        idprov:historialanimales,
        camposprov:""
    }
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