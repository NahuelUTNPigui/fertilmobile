import { writable } from 'svelte/store'
//import { browser } from "$app/environment"

//export const oscuro = writable(browser && localStorage.getItem("oscuro") || "no")
export const oscuro = writable(localStorage.getItem("oscuro") || "no")
oscuro.subscribe((val) => {    
    return (localStorage.setItem("oscuro",val))    
})