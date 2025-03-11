import { randomString } from "$lib/stringutil/lib";
export async function codigoRepetido(pb,codigo){
    const resultList = await pb.collection('Codigos').getList(1, 1, {
        filter: `id = '${codigo}'`,
        skipTotal :true
    });
    if(resultList.items.length == 0){
        return false
    }
    else{
        return true
    }
}
export async function codigoSinRepetir(pb) {
    let codigo = ""
    let repetido = true
    while(repetido){
        codigo = randomString(10,'n')
        repetido = await codigoRepetido(pb,codigo)
    }
    return codigo
}
//Establecimentos
export async function codigoRepetidoEstablecimiento(pb,codigo){
    const resultList = await pb.collection('CodigosEstablecimiento').getList(1, 1, {
        filter: `id = '${codigo}'`,
        skipTotal :true
    });
    if(resultList.items.length == 0){
        return false
    }
    else{
        return true
    }
}
export async function codigoSinRepetirEstablecimiento(pb) {
    let codigo = ""
    let repetido = true
    while(repetido){
        codigo = randomString(10,'n')
        repetido = await codigoRepetidoEstablecimiento(pb,codigo)
    }
    return codigo
}