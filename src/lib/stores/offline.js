import { Network } from '@capacitor/network';

export async function getInternet(modedebug,offline) {
    let coninternet = {connected:false} // await Network.getStatus();
    if(modedebug){
        if(!offline){
            coninternet = await Network.getStatus();
        }
    }
    else{
        coninternet = await Network.getStatus();
    }
    return coninternet
    
}