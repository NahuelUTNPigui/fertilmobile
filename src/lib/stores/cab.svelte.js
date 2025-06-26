import { browser } from "$app/environment"
//La idea es validar si tiene una cabaña

let defaultcab={
    cambio:false,
    exist:false,
    nombre:"",
    id:""
}
export function createCaber(){
    let cab = defaultcab
    //En capacitor esto es true
    if(browser){
        cab = JSON.parse(localStorage.getItem("cab"))||defaultcab
        
    }
    return{
        get cab() {return cab},
        setDefault:()=>{
            let newcab = {
                cambio:false,
                exist:false,
                nombre:"",
                id:""
            }
            localStorage.setItem("cab",JSON.stringify(newcab))
        },
        
        setCab:(nombre,id,cambio=false)=>{
            if(browser){
                let newcab = {
                    cambio,
                    exist:true,
                    nombre,
                    id
                }
                localStorage.setItem("cab",JSON.stringify(newcab))
            }
        }
    }
}