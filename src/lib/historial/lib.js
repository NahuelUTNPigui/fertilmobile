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
        prenada:record.prenada

    }
    await pb.collection("historialanimales").create(histo)
}