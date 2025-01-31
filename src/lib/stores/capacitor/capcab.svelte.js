import { Preferences } from '@capacitor/preferences';
let defaultcab={
    exist:false,
    nombre:"",
    id:""
}
export function createCaber(){
    let cab = $state(defaultcab)
    return{
        init:async()=>{
            const ret = await Preferences.get({ key: 'cab' });
            if(ret.value){
                cab = JSON.parse(ret.value)
            }
            else{
                await Preferences.set({
                    key:'cab',
                    value:JSON.stringify(defaultcab)
                })
            }
        },
        get cab(){
            return cab
        },
        setCab:async (c)=>{
            cab = c
            await Preferences.set({
                key:'cab',
                value:JSON.stringify(c)
            })
        },
        setDefault:async()=>{
            await Preferences.set({
                key:'cab',
                value:JSON.stringify(defaultcab)
            })
        }

    }
}