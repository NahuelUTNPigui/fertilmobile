<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import categorias from "$lib/stores/categorias";
    import Swal from "sweetalert2";
    import { generarIDAleatorio } from "$lib/stringutil/lib";
    import {  setComandosSQL} from '$lib/stores/sqlite/dbcomandos';
    import {addNewObservacionSQL} from '$lib/stores/sqlite/dbeventos';
    let {
        coninternet,
        comandos=$bindable([]),
        observaciones=$bindable([]),
        db,
        cabid,categoria,
        caravana=$bindable("")

    } = $props()
    let ruta = import.meta.env.VITE_RUTA
    const HOY = new Date().toISOString().split("T")[0]
    const pb = new PocketBase(ruta);
    let id = $state("")
    //let observaciones = $state([])
    //datos observacion
    let idobservacion =  $state("")
    let fecha = $state("")
    let observacion = $state("")
    let categoriaobs = $state("")
    async function guardarObservacionOnline() {
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
            await getObservaciones()
            
            Swal.fire("Éxito guardar","Se logró guardar la observación","success")

        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se logró guardar la observación","error")
        }
    }
    async function guardarObservacionOffline(){
        let idprov = "nuevo_obs_"+generarIDAleatorio()
        let data = {
            id:idprov,
            animal:id,
            fecha:fecha +" 03:00:00",
            categoria,
            cab:cabid,
            observacion,
            active:true,
            expand:{
                animal:{
                    caravana
                }
            }
        }
        await addNewObservacionSQL(db,data)
        observaciones.push(data)
        let nanimal = id.split("_").length>0
        let comando = {
            tipo:"add",
            coleccion:"observaciones",
            data:{...data},
            hora:Date.now(),
            prioridad:0,
            idprov:slug,
            camposprov:nanimal?"animal":""
        }
        comandos.push(comando)
        await setComandosSQL(db,comandos)
        Swal.fire("Éxito guardar","Se logró guardar la observación","success")  
    }
    async function guardarObservacion(){
        if(coninternet.connected){
            await guardarObservacionOnline()
        }
        else{
            await guardarObservacionOffline()
        }
        nuevaObservacion.close()
    }
    function openNewModal(id){
        idobservacion = id
        if(id==""){
            
            observacion = ""
            fecha = ""
            categoriaobs = categoria
        }
        else{
            let i_obs = observaciones.findIndex(o=>o.id==id)
            let o = observaciones[i_obs]
            observacion = o.observacion
            fecha = new Date(o.fecha).toISOString().split("T")[0]
            categoriaobs = o.categoria
        }
        
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
        
    })
</script>

<div class="w-full flex justify-items-start gap-2">

    <div>
        <button
            aria-label="Nuevo"
            onclick={()=>openNewModal("")}
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
        <div class="hidden w-full md:grid justify-items-center mx-1 lg:mx-10 lg:w-3/4 overflow-x-auto">
        
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
        <div class="block w-full md:hidden justify-items-center mx-1">
            {#each observaciones as o}
            <div class="card  w-full shadow-xl p-2 hover:bg-gray-200 dark:hover:bg-gray-900">
                <button onclick={()=>openNewModal(o.id)}>
                    <div class="block p-4">
                        <div class="grid grid-cols-2 gap-y-2">
                            <div class="flex items-start">
                                <span >Fecha:</span> 
                                <span class="mx-1 font-semibold">
                                    {new Date(o.fecha).toLocaleDateString()}
                                </span>
                                
                            </div>
                            <div class="flex items-start">
                                <span >Categoria:</span> 
                                <span class="mx-1 font-semibold">
                                    {`${categoriaobs}`}
                                </span>
                                
                            </div>
                            <div class="col-span-2 flex items-start">
                                <span >{`${o.observacion}`}</span> 
                                
                            </div>
                        </div>
                    </div>
                </button>
            </div>
            {/each}
        </div>
    {/if}
</div>
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
            <label for = "categoria" class="label">
                <span class="label-text text-base">Categoria</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2}
                    `}
                    bind:value={categoriaobs}
                >
                    {#each categorias as c}
                        <option value={c.id}>{c.nombre}</option>    
                    {/each}
                </select>
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
            {#if idobservacion == ""}
                <button class="btn btn-success text-white" onclick={guardarObservacion} >Guardar</button>
            {/if}
            <button class="btn btn-error text-white" onclick={()=>nuevaObservacion.close()}>Cancelar</button>
        </div>
        
    </div>
</dialog>
