//Esto es para hacer los eventos
export async function getPermisos(pb,user,idcab,idcolab) {
    let permisos = ""
    const resultList = await pb.collection('permisos').getList(1, 1, {
        expand:"estxcolab",
        filter: `estxcolab.cab='${idcab}' && estxcolab.colab='${idcolab}' `,
        skipTotal:true
    });
    permisos = resultList.items[0].permisos
    return permisos
}
export async function getCabData(pb,idcab) {
    let cab = {}
    let tactos = await pb.collection('tactos').getFullList({
        filter:`cab='${idcab}' && active=true`,
        sort: '-fecha',
        expand:"animal"
    });
    let servicios = await pb.collection('servicios').getFullList({
        sort: '-fechadesde ',
        filter :`cab = '${idcab}' && active = true`,
        expand:"madre"
    });
    let inseminaciones = await pb.collection('inseminacion').getFullList({
        sort: '-fechainseminacion ',
        filter :`cab = '${idcab}' && active = true`,
        expand:"animal"
    });
    let lotes = await pb.collection('lotes').getFullList({
        filter:`active=True && cab='${idcab}'`,
        sort: 'nombre',
    });
    let observaciones = await pb.collection('observaciones').getFullList({
        filter:`active=true && cab='${idcab}'`,
        expand:"animal",
        sort: '-fecha',
    });
    let rodeos = await pb.collection('rodeos').getFullList({
        filter:`active=true && cab='${idcab}'`,
        sort: 'nombre',
    });
    let tipostrat = await pb.collection('tipotratamientos').getFullList({
        filter : `(cab='${idcab}' || generico = true) && active = true`,
        sort: '-created',
    });
    let trats = await pb.collection('tratamientos').getFullList({
        filter : `cab='${idcab}' && active = true`,
        expand:"animal,tipo",
        sort: '-created',
    });
    let nacimientos = await pb.collection("nacimientosall").getFullList({
        filter:`cab='${cab.id}'`,
        sort:"-fecha",
        expand:"madre,padre"
    })
    let animaleselegir = await pb.collection("Animalestacto").getFullList({
        filter:`active=true && cab='${cab.id}'`,
        expand:"rodeo,lote,cab"
    })
    let animales = await pb.collection("animales").getFullList({
        filter:`active=true && delete=false && cab='${idcab}'`,
        expand:"rodeo,lote"
    })
    cab.tactos = tactos//11
    cab.servicios = servicios//10
    cab.inseminaciones = inseminaciones//9
    cab.observaciones = observaciones//8
    cab.lotes = lotes//7
    cab.rodeos = rodeos//6
    cab.tipostrat = tipostrat//5
    cab.trats = trats//4
    cab.nacimientos = nacimientos//3
    cab.animaleselegir = animaleselegir//2
    cab.animales = animales//1

    return cab
}
//Me hace ruido
export async function getCabsData(pb,user) {
    let cabspropias = await pb.collection('cabs').getFullList({
        filter:`user='${authData.record.id}' && active=true`,
        sort:"nombre"
    })
    for(let i = 0;i < cabspropias.length;i++){
        let tactos = []
        let servicios = []
        let inseminaciones = []
        let lotes = []
        let observaciones = []
        let rodeos = []
        let tipostrat = []
        let trats = []
        let permisos = ""
        let animales = []
    }

}
