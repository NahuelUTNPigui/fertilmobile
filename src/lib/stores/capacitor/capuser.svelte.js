import { Preferences } from '@capacitor/preferences';
let userdefault={
    id:"",
    username:"",
    email:"",
}
export function createUser(){
    let user = $state(userdefault)
    return {
        init:async ()=>{
            const ret = await Preferences.get({ key: 'user' });
            if(ret.value){
                user = JSON.parse(ret.value);
            }
            else{
                await Preferences.set({
                    key: 'user',
                    value: JSON.stringify(user)
                });
            }
        },
        get user() {
            return user
        },
        setUser:async (u)=>{
            user = u
            await Preferences.set({
                key: 'user',
                value: JSON.stringify(user)
            });
        },
        setDefault:async (u)=>{
            user = u
            await Preferences.set({
                key: 'user',
                value: JSON.stringify(userdefault)
            });
        }
    }
}