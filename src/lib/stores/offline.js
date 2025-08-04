import { Network } from '@capacitor/network';
export async function getOnlyInternet() {
    let coninternet = await Network.getStatus();
    return coninternet.connected
}
export async function getInternet(modedebug,offline,customoffline) {
    let coninternet = {connected:false,connectionType:"none"} // await Network.getStatus();
    if(modedebug){
        if(!offline){
            coninternet = await Network.getStatus();
        }
    }
    else{
        if(!customoffline){
            coninternet = await Network.getStatus();
        }
    }
    return coninternet
    
}