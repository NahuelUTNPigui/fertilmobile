<script>
    import {Network} from "@capacitor/network"
    import Swal from 'sweetalert2'
    import { goto } from '$app/navigation';
    import Oscuro from "$lib/components/OscuroLogin.svelte";
    import PocketBase from 'pocketbase'
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { onMount } from "svelte";
    

    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let usuarioemail=''
    let contra = ''
    let confirmcontra = ''
    
    let malusuarioname = false
    let malcontra = false
    let malconfirmcontra = false
    let conInternet =  false



    function isEmpty(str) {
        return (!str || str.length === 0 );
    }
    async function guardar(){
        if(isEmpty(usuarioemail)){
            Swal.fire('Error guardar', 'Nombre usuario vacio', 'error');
            return
        }
        if (isEmpty(contra)){
            Swal.fire('Error guardar', 'Contraseña vacia', 'error');
            return
        }
        if (isEmpty(confirmcontra)){
            Swal.fire('Error guardar', 'Confirmar contraseña no puede estar vacio', 'error');
            return
        }
        try{
            const data = {
                "username": usuarioemail.split("@")[0],
                "email": usuarioemail,
                "emailVisibility": true,
                "password": contra,
                "passwordConfirm": confirmcontra,
                "name": usuarioemail,
                "active": true
            };
            const record = await pb.collection('users').create(data);

            goto("/")
        }catch(e){
            console.log(e)
            Swal.fire('Error guardar', 'No se puede crear el nuevo usuario', 'error');
        }
        
    }
    function volver(){
        goto("/")
    }
    function keyEvent(e){
        if(e.code=="Enter"){
            if(usuarioemail !="" && contra !="" && confirmcontra !=""){
                guardar()
            }
        }
    }
    onMount(async ()=>{
        let status = await Network.getStatus()
        if(status.connected){
            conInternet = true
        }
    })
</script>
<svelte:window on:keydown={keyEvent}></svelte:window>   
<div class="min-h-screen bg-gradient-to-br from-green-400 to-green-700  dark:from-gray-900 dark:to-gray-800 p-4">
    <div class="flex justify-end m-10">
        <Oscuro></Oscuro>
    </div>
    <div class="flex items-center justify-center">
        <div 
            class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full"
            in:fly="{{ y: 50, duration: 100, easing: quintOut }}"
            out:fade
        >
            <h1 class="text-3xl font-bold text-green-700 dark:text-green-400 mb-6 text-center">Crear usuario</h1>
            <div class="space-y-6">
                <div>
                    <label for="nombreusuario" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Email
                    </label>
                    <input 
                        type="nombreusuario" 
                        id="nombreusuario" 
                        bind:value={usuarioemail} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                <div>
                    <label for="password" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Contraseña
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        bind:value={contra} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                <div>
                    <label for="passwordconf" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Confirmar Contraseña
                    </label>
                    <input 
                        type="password" 
                        id="passwordconf" 
                        bind:value={confirmcontra} 
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                </div>
                {#if conInternet}
                <div>
                    <button 
                        onclick={guardar}
                        class="w-full bg-green-600 text-white rounded-md py-2 px-4 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition" 
                    >
                      Crear cuenta
                    </button>
                </div>
                {:else}
                    <div class="mt-8 flex justify-end">
                        Debes tener internet para guardar la cabaña
                    </div>
                {/if}
            </div>
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Ya tienes cuenta?
                    <a href="/" 
                    class="font-medium text-green-600 dark:text-green-400  hover:text-green-800 dark:hover:text-green-300 transition"
                    >
                        Volver
                    </a>
                </p>
            </div>
        </div>
    </div>
</div>