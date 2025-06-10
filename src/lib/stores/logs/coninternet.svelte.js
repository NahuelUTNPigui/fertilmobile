let offline = $state(false)
export const offliner={
    get offline(){
        return offline
    },
    setOffline:(off)=>{
        offline = off
    }
}