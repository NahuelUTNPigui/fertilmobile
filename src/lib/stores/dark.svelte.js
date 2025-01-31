import { browser } from "$app/environment"

export function createDarker(){
    let modo = "no"
    if(browser){
        modo = localStorage.getItem("oscuro")||"no"
    }
    
    let dark = $state(modo == "si")
    return {
        get dark() {return dark},
        setDark: (mode)=>{
            if(browser){
                localStorage.setItem("oscuro",mode?"si":"no")
            
                dark = mode
            }
            
        }
    }
}