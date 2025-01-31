import { writable } from 'svelte/store'
import { browser } from "$app/environment"

export const usuario = writable(browser && localStorage.getItem("user") || '')
usuario.subscribe((val) => {
    if(browser){
        return (localStorage.setItem("user",val))    
    }
    else{
        return ""
    }
    
})