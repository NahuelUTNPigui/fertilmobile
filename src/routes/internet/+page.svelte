<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import { offliner } from '$lib/stores/logs/coninternet.svelte';
    import {customoffliner} from  '$lib/stores/offline/custom.svelte';
    import PocketBase from 'pocketbase'
    import CardBase from '$lib/components/CardBase.svelte';
    import { getInternet } from '$lib/stores/offline';
    import { Network } from '@capacitor/network';
    import { onMount } from 'svelte';
    import { setInternetSQL } from '$lib/stores/sqlite/dbinternet';
    import {getUserOffline,setDefaultUserOffline} from "$lib/stores/capacitor/offlineuser"
    import {getCabOffline,setDefaultCabOffline} from "$lib/stores/capacitor/offlinecab"
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    //evento
    import {
        getTotalesEventosOnline,
        addNewTactoSQL,
        getEventosSQL, 
        setUltimoEventosSQL,
        addNewNacimientoSQL,
        addNewTrataSQL,
        addNewObservacionSQL,
        addnewInseminacionSQL,
        addNewServicioSQL,
        updateLocalEventosSQLUser,

        getTratsSQL

    } from '$lib/stores/sqlite/dbeventos';

    import { 
        setAnimalesSQL,
        getAnimalesSQL, 
        setUltimoAnimalesSQL,
        setHistorialAnimalesSQL,
        updateLocalAnimalesSQLUser,
        updateLocalHistorialAnimalesSQLUser 
    } from '$lib/stores/sqlite/dbanimales';
    import {updateLocalEstablecimientosSQL} from '$lib/stores/sqlite/dballestablecimientos';
    import {updateLocalColabSQL, updateLocalColabSQLUser} from '$lib/stores/sqlite/dbcolaboradores'; 
    
    import { loger } from '$lib/stores/logs/logs.svelte';
    let ruta = import.meta.env.VITE_RUTA
    let modedebug = import.meta.env.VITE_MODO_DEV == "si"
    let actualizando = $state(false)
    let classbutton = $state("w-full flex items-center justify-center space-x-4 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 dark:bg-green-700 dark:hover:bg-green-600")
    let pre = ""
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    //offline
    let db = $state(null)
    let usuarioid = $state("")
    let useroff = $state({})
    let caboff = $state({})
    
    let coninternet = $state({})
    let custom = $state(false)
    
    async function initPage() {
        useroff = await getUserOffline()
        caboff = await getCabOffline()
        usuarioid = useroff.id
        db = await openDB()
    }
    onMount(async ()=>{
        await initPage()
        custom = customoffliner.customoffline
        if(modedebug){
            if(!offliner.offline){
                coninternet = await Network.getStatus();
            }
        }
        else{
            
            coninternet = await Network.getStatus();            
            if(!coninternet.connected){
                classbutton = "w-full flex items-center justify-center space-x-4 bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-lg cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
            }

        }
    })
    

    async function actualizarDatos() {
        actualizando = true
        loger.addTextLog(actualizando)
        await setInternetSQL(db,1,Date.now())
        loger.addLineaNumber(76)
        let animalesuser = await updateLocalAnimalesSQLUser(db,pb,usuarioid)  
        loger.addLineaNumber(78)
        await updateLocalHistorialAnimalesSQLUser(db,pb,usuarioid)
        loger.addLineaNumber(80)
        //Debo traer los datos de la cabaña
        await updateLocalEstablecimientosSQL(db,pb,usuarioid,caboff.id)
        let datauser = await updateLocalEventosSQLUser(db,pb,usuarioid)
        await updateLocalColabSQLUser(db,pb,usuarioid)
        actualizando = false
        loger.addTextLog(actualizando)
    }
</script>
<Navbarr>
    <CardBase titulo="Conectividad de la aplicación">
        {#if caboff.exist}
            <button class={`${classbutton}`}
                disabled={!coninternet.connected}
                onclick={actualizarDatos}
            >
                Actualizar datos
            </button> 
        {/if}
        {#if actualizando}
            <!-- Contenedor del spinner -->
            <div id="spinner-container" class="flex justify-center items-center h-32">
                <!-- Spinner de DaisyUI -->
                <span class="loading loading-spinner loading-lg text-primary" 
                    id="spinner"></span>
            </div>
        {/if}
        
        <div class="space-y-4">
            <div class="">
                <div class="form-control w-11/12 lg:w-1/2">
                        <br>
                        {#if coninternet.connected}
                            <span class="label-text text-base">Hay conexión</span>
                        {:else}
                            <span class="label-text text-base">No hay conexión</span>
                        {/if}
                        
                        
                    
                </div>
            </div>
            <div class="">
                <div class="form-control w-11/12 lg:w-1/2">
                    <label class="label cursor-pointer">
                        <span class="label-text text-base">Modo offline</span>
                        <input 
                            type="checkbox" 
                            class="toggle toggle-md toggle-success" 
                            bind:checked={custom} 
                            onchange={()=>{customoffliner.setCustomOffline(custom)}}
                        />
                    </label>
                </div>
            </div>
        </div>
    </CardBase>
</Navbarr>