export async function getTotalAnimales(pb,usuarioid) {
    let animals = await pb.collection('Animalesxuser').getList(1,1,{filter:`user='${usuarioid}'`})
    return animals.totalItems
}
