import { Preferences } from '@capacitor/preferences';
let defaultper={
    permisos:"",
    //ID del usuario
    id:""
}
export function createPermiser(){
    let permisos = $state(defaultper)
    return{
        init:async ()=>{
            const ret = await Preferences.get({ key: 'permisos' });
            if(ret.value){
                permisos = JSON.parse(ret.value);
            }
            else{
                await Preferences.set({
                    key: 'permisos',
                    value: JSON.stringify(permisos)
                });
            }
        },
        get permisos(){
            return permisos
        },
        setDefault:()=>{            
            localStorage.setItem("permisos",JSON.stringify(defaultper))
        },
        setPermisos:async (p)=>{
            permisos = p
            await Preferences.set({
                key: 'permisos',
                value: JSON.stringify(p)
            }); 
        }

    }
}