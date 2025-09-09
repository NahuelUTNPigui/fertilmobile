import { Network } from '@capacitor/network';
export async function getOnlyInternet() {
    let isOnline = await Network.getStatus();
    return isOnline.connected
}
export async function getInternet(modedebug,offline,customoffline) {
    let coninternet = {connected:false,connectionType:"none"} // await Network.getStatus();
    if(modedebug){
        if(!offline && !customoffline){
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