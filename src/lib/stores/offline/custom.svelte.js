//Esta variable refleja si quiero tener la version 
//sin internet
let customoffline = $state(false)
export const customoffliner={
    get customoffline(){
        return customoffline
    },
    setCustomOffline:(off)=>{
        customoffline = off
    }
}