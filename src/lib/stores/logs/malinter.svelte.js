// Bandera para saber si tengo o no interneta
let randinter = $state(false)
//probabilidad de no tener internet para probar la falta de internet
let prb  = $state(0.0)
export const rnder={
    get prb(){
        return prb
    },
    setPrb:(p)=>{
        prb = p
    },
    get randinter(){
        return randinter
    },
    setRnd:(rnd)=>{
        randinter = rnd
    },
    conInter:()=>{
        let n = Math.random()
        return n > prb
    }
}