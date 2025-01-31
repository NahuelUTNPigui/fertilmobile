import { browser } from "$app/environment"

export function createRoler(){
    let localrol = "cab"
    //if(browser){
    //    localrol = localStorage.getItem("rol")||""
    //}
    
    let rol = $state(localrol)
    return {
        get rol() {return localrol},
        setRol: (p_rol)=>{
            if(browser){
                localStorage.setItem("rol",p_rol)
                rol  = p_rol
            }
            
        }
    }
}