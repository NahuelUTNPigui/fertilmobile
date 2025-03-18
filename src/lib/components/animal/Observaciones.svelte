<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import categorias from "$lib/stores/categorias";
    let {cabid,categoria} = $props()
    let ruta = import.meta.env.VITE_RUTA
    const HOY = new Date().toISOString().split("T")[0]
    const pb = new PocketBase(ruta);
    let id = $state("")
    let observaciones = $state([])
    //datos observacion
    let fecha = $state("")
    let observacion = $state("")
    async function guardarObservacion(){
        try{
            let data = {
                animal:id,
                fecha:fecha +" 03:00:00",
                categoria,
                cab:cabid,
                observacion,
                active:true
            }
            const record = await pb.collection('observaciones').create(data);
            observaciones.push(record)
            
            

        }
        catch(err){
            console.error(err)
            
        }
        nuevaObservacion.close()
    }
    function openNewModal(){
        observacion = ""
        fecha = ""
        nuevaObservacion.showModal()
    }
    async function getObservaciones(){
        const records = await pb.collection('observaciones').getFullList({
            sort: '-fecha',
            filter :`animal = '${id}' && active=true`,
        });
        observaciones = records
    }
    onMount(async ()=>{
        id = $page.params.slug
        await getObservaciones()
    })
</script>

<div class="w-full flex justify-items-start gap-2">
    <div class="hidden">
        <button
            aria-label="Expandir"
            onclick={()=>expandirObservacion.showModal()}
            class={`
                ${estilos.basico} ${estilos.chico} ${estilos.primario} 
                ${observaciones.length == 0?estilos.deshabilitado:""}
            `}
            disabled = {observaciones.length == 0}
        >
            Expandir                
        </button>
    </div>
    <div>
        <button
            aria-label="Nuevo"
            onclick={openNewModal}
            class={`
                ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
            `}
        >
            Nuevo
        </button>
    </div>
</div>
<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if observaciones.length == 0}
        <p class="mt-5 text-lg ">No hay observaciones</p>
    {:else}
        <table class="table table-lg" >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                    <th class="text-base mx-1 px-1">Observacion</th>
                    <th class="text-base mx-1 px-1">Categoria</th>

                </tr>
            </thead>
            <tbody>
                {#each observaciones as o}
                    <tr>
                        <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(o.fecha).toLocaleDateString()}</td>
                        <td class="text-base mx-1 px-1">
                            {`${o.observacion}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${o.categoria}`}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
<dialog id="expandirObservacion" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div
        class="
            modal-box w-11/12 max-w-3xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Observaciones</h3>  
        <div class="form-control">
            <table class="table table-lg" >
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                        <th class="text-base mx-1 px-1">Observacion</th>
                        <th class="text-base mx-1 px-1">Categoria</th>
    
                    </tr>
                </thead>
                <tbody>
                    {#each observaciones as o}
                        <tr>
                            <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(o.fecha).toLocaleDateString()}</td>
                            <td class="text-base mx-1 px-1">
                                {`${o.observacion}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${o.categoria}`}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="modal-action justify-start ">
            <button class={`${estilos.basico} ${estilos.medio} ${estilos.secundario}`} onclick={()=>expandirObservacion.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
<dialog id="nuevaObservacion" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div 
        class="
            modal-box w-11/12 max-w-5xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Nueva observacion</h3>  
        <div class="form-control">
            
            <label for = "fecha" class="label">
                <span class="label-text text-base">Fecha </span>
            </label>
            <label class="input-group ">
                <input id ="fecha" type="date" max={HOY}  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}
                    `} 
                    bind:value={fecha}
                />
            </label>
            <div class="label">
                <span class="label-text">Observacion</span>                    
            </div>
            <input 
                id ="observacion" 
                type="text"  
                class={`
                    input 
                    input-bordered 
                    border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                    w-full
                    ${estilos.bgdark2}
                `}
                bind:value={observacion}
            />
            
        </div>
        <div class="modal-action justify-start ">
            <button class="btn btn-success text-white" onclick={guardarObservacion} >Guardar</button>
            <button class="btn btn-error text-white" onclick={()=>nuevaObservacion.close()}>Cancelar</button>
        </div>
        
    </div>
</dialog>
