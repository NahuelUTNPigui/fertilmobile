import { loger } from "../logs/logs.svelte";
let modedebug = import.meta.env.VITE_MODO_DEV == "si"
let ruta = import.meta.env.VITE_RUTA
let velocidad = $state(false)
export const velocidader={
    get velocidad(){
        return velocidad
    },
    setVelocidad:(vel)=>{
        velocidad = vel
    },
    medirVelocidadInternet:async ()=>{
        //const url = "https://www.google.com/images/phd/px.gif"; // 43 bytes
        
        try {
            const inicio = Date.now();
            const res = await fetch(ruta+"/hello/x" );
            const fin = Date.now();
            const duracion = (fin - inicio) / 1000; // en segundos
            
            const bytes = parseInt(res.headers.get("content-length") || "22");

            return bytes / duracion; // bytes por segundo
        } catch(err) {
            if(modedebug){
                loger.addError(JSON.stringify(err,null,2))
            }
            
            return 0; // error o sin conexión
        }
    }
}