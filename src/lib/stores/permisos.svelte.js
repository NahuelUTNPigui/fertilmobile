import { browser } from "$app/environment"
let defaultper={
    permisos:"",
    //ID del usuario
    id:""
}
export function createPer(){
    let per = defaultper
    if(browser){
        per = JSON.parse(localStorage.getItem("per"))||defaultper
    }
    return{
        get per() {return per},
        setDefault:()=>{
            let newper = {
                permisos:"",
                id:""
            }
            localStorage.setItem("per",JSON.stringify(newper))
        },
        setPer:(permisos,id)=>{
            if(browser){
                let newper = {
                    permisos,
                    id
                }
                localStorage.setItem("per",JSON.stringify(newper))
            }
        }
    }
}