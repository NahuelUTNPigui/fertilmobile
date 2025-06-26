import { Network } from '@capacitor/network';

export async function getInternet(modedebug,offliner) {
    let coninternet = {connected:false} // await Network.getStatus();
    if(modedebug){
        
        if(!offliner.offline){
            coninternet = await Network.getStatus();
        }
    }
    else{
        coninternet = await Network.getStatus();
    }
    return coninternet
}