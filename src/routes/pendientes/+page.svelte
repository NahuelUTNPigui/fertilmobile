<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Swal from 'sweetalert2'
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import { onMount } from 'svelte';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {getCabOffline} from "$lib/stores/capacitor/offlinecab"
    import { getUserOffline } from '$lib/stores/capacitor/offlineuser';
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import PocketBase from 'pocketbase'
    import { capitalize } from '$lib/stringutil/lib';
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    import { ACTUALIZACION } from '$lib/stores/constantes';
    import { loger } from '$lib/stores/logs/logs.svelte';
    import { getInternet } from '$lib/stores/offline';
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let ruta = import.meta.env.VITE_RUTA
    let pre = ""
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let db = $state(null)
    let caboff = $state({})
    let usuarioid = $state("")
    let useroff = $state({})
    let coninternet = $state({connected:false})
    let comandos = $state([])
    let getlocal = $state(false)
    
    async function initPage() {
        //if(modedebug){
        //    coninternet = {connected:false} // await Network.getStatus();
        //    if(!offliner.offline){
        //        coninternet = await Network.getStatus();
        //    }
        //}
        //else{
        //    coninternet = await Network.getStatus();
        //}
        coninternet = await getInternet(modedebug,offliner.offline)
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
        
    }
    function getColeccionName(coleccion){
        let s = coleccion
        if(coleccion=="inseminacion"){
            s = `Inseminaciones`
            //s = JSON.stringify(data,null,2)
        }
        else if(coleccion == "historialanimales"){
            s = `Historial`
        }
        else if(coleccion == "servicios"){
            s = "Servicios"
        }
        else if(coleccion=="tactos"){
            s = "Tactos"
        }
        else if(coleccion == "tratamientos"){
            s = "Tratamientos"
        }
        else if(coleccion == "tipotratamientos"){
            s = "Tipo de tratamientos"
        }
        else if(coleccion == "pesaje"){
            s = "Pesajes"
        }
        else if(coleccion == "animales"){
            s = "Animales"
        }
        else if(coleccion == "nacimientos"){
            s = "Nacimientos"
        }
        else if(coleccion == "observaciones"){
            s = "Observaciones"
        }
        else if(coleccion == "rodeos"){
            s = "Rodeos"
        }
        else if(coleccion == "lotes"){
            s = "Lotes"
        }
        else if(coleccion == "cabs"){
            s = "Establecimiento"
        }
        return s
    }
    function getDescripcion(coleccion,data){
        let s = ""
        if(coleccion=="inseminacion"){
            s = `Fecha: ${new Date(data.fechainseminacion).toLocaleDateString()} \nObservacion: ${data.observacion}`
            //s = JSON.stringify(data,null,2)
        }
        else if(coleccion == "historialanimales"){
            s = `Caravana: ${data.caravana}`
        }
        else if(coleccion == "servicios"){
            s = `Fecha: ${new Date(data.fechadesde).toLocaleDateString()} \nObservacion: ${data.observacion}`
        }
        else if(coleccion=="tactos"){
            s = `Fecha: ${new Date(data.fecha).toLocaleDateString()} \nObservacion: ${data.observacion}`
        }
        else if(coleccion == "tratamientos"){
            s = `Fecha: ${new Date(data.fecha).toLocaleDateString()} \nObservacion: ${data.observacion}`
        }
        else if(coleccion == "tipotratamientos"){
            s = `Nombre: ${data.nombre}`
        }
        else if(coleccion == "pesaje"){
            s = `Fecha: ${new Date(data.fecha).toLocaleDateString()} \nPeso: ${data.pesonuevo}`
        }
        else if(coleccion == "animales"){
            s = `Caravana : ${data.caravana}`
        }
        else if(coleccion == "nacimientos"){
            s = `Fecha: ${new Date(data.fecha).toLocaleDateString()} \nObservacion: ${data.observacion}`
        }
        else if(coleccion == "observaciones"){
            s = `Fecha: ${new Date(data.fecha).toLocaleDateString()} \nObservacion: ${data.observacion}`
        }
        else if(coleccion == "rodeos"){
            s = `Nombre: ${data.nombre}`
        }
        else if(coleccion == "lotes"){
            s = `Nombre: ${data.nombre}`
        }
        else if(coleccion == "cabs"){
            s = `Nombre: ${data.nombre}`
        }
        return s
    }
    function getNombreTipo(tipo){
        if(tipo =="add"){
            return "Nuevo"
        }
        if(tipo =="update"){
            return "Modificar"
        }
        if(tipo =="delete"){
            return "Eliminar"
        }
    }
    onMount(async ()=>{
        await initPage()
        if(caboff.exist){
            db = await openDB()
            //Reviso el internet
            let lastinter = await getInternetSQL(db)
            let rescom = await getComandosSQL(db)
            comandos = rescom.lista
            if (coninternet.connected){
                
                await flushComandosSQL(db,pb)
                comandos = []
            }
        }
    })
</script>
<Navbarr>
    {#if modedebug}
        <div class="grid grid-col-3">
            <div class="label">
                pendientes - {comandos.length}
            </div>
            <div class="label">
                get local: {getlocal}
            </div>
            <div class="label">
                <span>
                    con internet: {coninternet.connected}
                </span>
            </div>
        </div>
    {/if}
    <div class="grid grid-cols-2 mx-1 lg:mx-10 mt-1 w-11/12">
        <div class="">
            <h1 class="text-2xl">Operaciones pendientes</h1>  
        </div>
    </div>
    {#if comandos.length == 0}
        <div>
            No tienes operaciones pendientes
        </div>
    {:else}
        <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
            <table class="table table-lg w-full" >
                <thead>
                    <tr>
                        <th
                            class="text-base p-3 border-b dark:border-gray-600 "
                        >
                            Colección
                        </th>
                        <th
                            class="text-base p-3 border-b dark:border-gray-600 "
                        >
                            Tipo
                        </th>
                        <th
                            class="text-base p-3 border-b dark:border-gray-600 "
                        >
                            Fecha
                        </th>
                        <th
                            class="hidden text-base p-3 border-b dark:border-gray-600 "
                        >
                            Descripcion
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each comandos as c}
                        <tr class=" hover:bg-gray-200 dark:hover:bg-gray-900" >
                            <td class="text-base p-3 ">
                                {getColeccionName(c.coleccion)}
                            </td>
                            <td class="text-base p-3 ">
                                {getNombreTipo(c.tipo)}
                            </td>
                            <td class="text-base p-3 ">
                                {new Date(c.hora).toLocaleDateString()}
                            </td>
                            <td class="hidden text-base p-3 ">
                                {getDescripcion(c.coleccion,c.data)}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="block  md:hidden justify-items-center mx-1">
            {#each comandos as c}
                <div class="card w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
                    <div class="block p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-medium">{getColeccionName(c.coleccion)}</h3>
                        </div>
                        <div class="grid grid-cols-2 gap-y-2">
                            <div class="flex items-start">
                                <span >Tipo:</span> 
                                <span class="font-semibold">
                                    {getNombreTipo(c.tipo)}
                                </span>
                            </div>
                            <div class="flex items-start">
                                <span >Fecha:</span> 
                                <span class="font-semibold">
                                    {new Date(c.hora).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="flex items-start cols-span-2">
                                <div class="grid grid-cols-1">
                                    <span >Datos:</span> 
                                    <span class="font-semibold">
                                        {getDescripcion(c.coleccion,c.data)}
                                    </span>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
    
</Navbarr>