import { browser } from "$app/environment"
export function createUserer(){
    let userid = ""   
    
    if(browser){
        let pb_json =  JSON.parse(localStorage.getItem('pocketbase_auth'))
        userid = pb_json.model.id
    }
    return{
        get userid(){return userid}
    }
}