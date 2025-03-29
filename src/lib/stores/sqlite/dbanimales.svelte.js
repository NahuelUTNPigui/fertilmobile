//En este archivo se va a usar los animales en toda la aplicacion
//No se como funcionan los stores a lo largo de la aplicacion
export function createDBAnimal(){
    //Todos,acitvos y no activos
    let animales = $state([])
    return {
        get animales() {return animales},
        setAnimales:(p_animales)=> {
            animales = p_animales
        }
    }
}