let intermitente = $state([])
export const intermitenter={
    get intermitente(){
        return offline
    },
    setIntermitente:(inter)=>{
        intermitente = inter
    },
    addIntermitente:(inter)=>{
        if(intermitente.length>9){
            intermitente.push(inter)
            intermitente.shift()
        }
        else{
            intermitente.push(inter)
        }
    },
    calculateIntermitente:()=>{
        let n = intermitente.length
        let conf = intermitente.filter(inter=>inter).length
        return conf/n

    }
}