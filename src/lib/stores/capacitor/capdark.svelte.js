import { Preferences } from '@capacitor/preferences';

export function createDarker(){
    let modo = $state({dark:false})
    
    return {
        init:async ()=>{
            const ret = await Preferences.get({ key: 'modo' });
            if(ret.value){
                modo = JSON.parse(ret.value);
            }
            else{
                await Preferences.set({
                    key: 'modo',
                    value: JSON.stringify(modo)
                });
            }
        },
        get modo() {
            return modo
        },
        setDark: async (mode)=>{
            modo.dark = mode
            await Preferences.set({
                key: 'modo',
                value: JSON.stringify({
                  dark: mode,
                })
            });
        }
    }
}