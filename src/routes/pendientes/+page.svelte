<script>
    import Navbarr from '$lib/components/Navbarr.svelte';
    import Swal from 'sweetalert2'
    import {openDB,resetTables} from '$lib/stores/sqlite/main'
    import { Network } from '@capacitor/network';
    import { onMount } from 'svelte';
    import {getInternetSQL, setInternetSQL} from '$lib/stores/sqlite/dbinternet'
    import {getCabOffline} from "$lib/stores/capacitor/offlinecab"
    import { getComandosSQL, setComandosSQL, flushComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    let db = $state(null)
    let caboff = $state({})
    let coninternet = $state(false)
    let comandos = $state([])
    async function initPage() {
        //coninternet = {connected:false} // await Network.getStatus();
        coninternet = await Network.getStatus();
        
        caboff = await getCabOffline()
        
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
                            class="text-base p-3 border-b dark:border-gray-600 "
                        >
                            Descripcion
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each comandos as c}
                    <tr class=" hover:bg-gray-200 dark:hover:bg-gray-900" >
                            <td class="text-base p-3 ">
                                {c.coleccion}
                            </td>
                            <td class="text-base p-3 ">
                                {c.tipo}
                            </td>
                            <td class="text-base p-3 ">
                                {c.hora}
                            </td>
                            <td class="text-base p-3 ">
                                {c.data}
                            </td>
                            <td class="text-base p-3 ">

                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="block  md:hidden justify-items-center mx-1">
            {#each comandos as c}
            <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
                <div class="block p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-medium">{c.coleccion}</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-y-2">
                        <div class="flex items-start">
                            <span >Tipo:</span> 
                            <span class="font-semibold">
                                {c.tipo}
                            </span>
                        </div>
                        <div class="flex items-start">
                            <span >Fecha:</span> 
                            <span class="font-semibold">
                                {c.hora}
                            </span>
                        </div>
                        <div class="flex items-start cols-span-2">
                            <span >Descripcion:</span> 
                            <span class="font-semibold">
                                {JSON.stringify(c.data)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {/each}
        </div>
    {/if}
    
</Navbarr>