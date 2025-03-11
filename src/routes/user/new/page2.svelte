<script>
    import {Network} from "@capacitor/network"
    import Swal from 'sweetalert2'
    import { goto } from '$app/navigation';
    import Oscuro from "$lib/components/OscuroLogin.svelte";
    import PocketBase from 'pocketbase'
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { onMount } from "svelte";
    import {enabled} from '$lib/stores/enabled'
    import {usuario} from '$lib/stores/usuario'
    import { randomString } from '$lib/stringutil/lib';
    

    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let usuarioemail=''
    let contra = ''
    let confirmcontra = ''
    let nombre = ''
    let apellido = ''
    let malnombre = false
    let malapellido = false
    let malusuarioname = false
    let malcontra = false
    let malconfirmcontra = false
    let botonhabilitado = false



    function isEmpty(str) {
        return (!str || str.length === 0 );
    }
    function validarBoton(){
        botonhabilitado = true
        if(isEmpty(nombre)){
            botonhabilitado = false
            return
        }
        if(isEmpty(apellido)){
            botonhabilitado = false
            return
        }
        if(isEmpty(usuarioemail)){
            botonhabilitado = false
            return
        }
        if (isEmpty(contra) || contra.length < 10){
            botonhabilitado = false
            return
        }
        if (contra != confirmcontra){
            botonhabilitado = false
            return
        }
    }
    function onInput(campo){
        validarBoton()
        if (campo=="NOMBRE"){
            if(isEmpty(nombre)){
                malnombre = true
            }
            else{
                malnombre = false
            }
        }
        if (campo=="APE"){
            if(isEmpty(apellido)){
                malapellido = true
            }
            else{
                malapellido = false
            }
        }
        if(campo == "EMAIL"){
            if(isEmpty(usuarioemail)){
                malusuarioname = true
            }
            else{
                malusuarioname = false
            }
        }
        else if(campo == "CONTRA"){
            if(isEmpty(contra) || contra.length < 10){
                malcontra = true
            }
            else{
                malcontra = false
            }
        }
        else if(campo == "CONF"){
            if(contra != confirmcontra){
                malconfirmcontra = true
            }
            else{
                malconfirmcontra = false
            }
        }
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
        let coincide = await existeCorreo(usuarioemail)
        if(coincide){
            Swal.fire('Error guardar', 'Ya existe un usuario con ese correo', 'error');
            return
        }
        try{
            let nombredata = nombre.trim().split(" ").filter(w=>w !== "").join(".")
            let apellidodata = nombre.trim().split(" ").filter(w=>w !== "").join(".")
            const data = {
                "username": nombredata+"."+apellidodata,
                "email": usuarioemail.trim(),
                "emailVisibility": true,
                "password": contra,
                "passwordConfirm": confirmcontra,
                "name": usuarioemail.trim(),
                "nombre":nombre.trim(),
                "apellido":apellido.trim(),
                "active": true,
                "codigo":randomString(10,"n")
            };
            const record = await pb.collection('users').create(data);
            Swal.fire('Éxito guardar', 'Se logró guardar el nuevo usuario. Ingrese a la aplicación', 'success');
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
    async function existeCorreo() {
        
        const record = await pb.collection('users').getList(1,1,
        {
            filter:`email = '${usuarioemail}' && active = true`
        });
        
        if(record.totalItems != 0){
            return true
        }
        else{
            return false
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
            in:fly="{{ y: 50, duration: 500, easing: quintOut }}"
            out:fade
        >
            <h1 class="text-3xl font-bold text-green-700 dark:text-green-400 mb-6 text-center">Crear usuario</h1>
            <div class="space-y-6">
                <div>
                    <label for="nombr" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Nombre
                    </label>
                    <input 
                        type="nombre" 
                        id="nombre" 
                        bind:value={nombre} 
                        oninput={()=>onInput("NOMBRE")}
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malnombre}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir el nombre que usará, lo puede cambiar mas adelante</span>                    
                        </div>
                    {/if}
                </div>
                <div>
                    <label for="apellido" 
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Apellido
                    </label>
                    <input 
                        type="apellido" 
                        id="apellido" 
                        bind:value={apellido} 
                        oninput={()=>onInput("APE")}
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malapellido}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir el apellido que usará, luego lo podrá cambiar</span>                    
                        </div>
                    {/if}
                </div>
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
                        oninput={()=>onInput("EMAIL")}
                        required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malusuarioname}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir el correo que usará</span>                    
                        </div>
                    {/if}
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
                        oninput={()=>onInput("CONTRA")}
                        
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malcontra}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe escribir una contraseña de al menos 10 caracteres</span>                    
                        </div>
                    {/if}
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
                        oninput={()=>onInput("CONF")}
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {#if malconfirmcontra}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Deben coincidir las contraseñas</span>                    
                        </div>
                    {/if}
                </div>
                <div>
                    <button 
                        onclick={guardar}
                        class="w-full bg-green-600 text-white rounded-md py-2 px-4 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition" 
                        disabled='{!botonhabilitado}'
                    >
                      Crear cuenta
                    </button>
                </div>
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