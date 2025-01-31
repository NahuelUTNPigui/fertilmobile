// src/stores/enabled.ts
import { writable } from 'svelte/store'
import { browser } from "$app/environment"

export const enabled = writable(browser && localStorage.getItem("authd") || "no")
enabled.subscribe((val) => {
    if(browser){
        return (localStorage.setItem("authd",val))    
    }
    else{
        return ""
    }
    
})