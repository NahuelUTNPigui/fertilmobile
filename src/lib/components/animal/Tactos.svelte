<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import tipostacto from '$lib/stores/tipostacto';
    import tiposanimal from '$lib/stores/tiposanimal';
    import categorias from "$lib/stores/categorias";
    import estados from "$lib/stores/estados";
    import {guardarHistorial} from "$lib/historial/lib"
    import RadioButton from "../RadioButton.svelte";
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    let tactos=$state([])
    let id = $state("")
    let {cabid,prenadaori=$bindable(0),categoria} = $props()
    //Datos tacto
    let tacto = $state(null)
    let idtacto = $state("")
    let fecha = $state("")
    let observacion = $state("")
    let animal = $state("")
    //Tipo animal
    
    let prenada = $state(0)
    //tipo tacto
    let tipo = $state("tacto")
    let nombreveterinario = $state("")
    function openNewModal(){
        fecha = ""
        observacion =  ""
        animal = ""
        tipo = "tacto"
        nombreveterinario = ""
        nuevoTactoAnimal.showModal()
    }
    async function guardarTacto(){
        try{
            let data = {
               fecha:fecha +" 03:00:00" ,
               observacion,
               animal:id,
               categoria,
               prenada,
               tipo,
               nombreveterinario,
               cab:cabid,
               active:true
            }
            const record = await pb.collection('tactos').create(data);
            await guardarHistorial(pb,id)
            prenadaori = prenada
            await pb.collection('animales').update(id,{
                prenada
            })

            tactos.push(record)
        }
        catch(err){
            console.error(err)
            
        }
        nuevoTactoAnimal.close()
    }
    function getTipoNombre(tipo){
        let tp = tipostacto.filter(t=>t.id==tipo)[0]
        if(tp){
            return tp.nombre
        }
        else{
            return ""
        }
        
    }
    function getCategoriaNombre(cat){
        let tp = tiposanimal.filter(c=>c.id==cat)[0]
        if(tp){
            return tp.nombre
        }
        else{
            return ""
        }
        
    }
    async function getTactos(){
        const recordst = await pb.collection('tactos').getFullList({
            filter:`animal='${id}'`,
            sort: '-created'
        });
        tactos = recordst
        
    }
    
    onMount(async ()=>{
        id = $page.params.slug
        prenada = prenadaori
        await getTactos()
    })

</script>
<div class="w-full flex justify-items-start gap-2">
    <div class="hidden">
        <button
            aria-label="Expandir"
            onclick={()=>expandirTacto.showModal()}
            class={`
                ${estilos.basico} ${estilos.chico} ${estilos.primario}
                ${tactos.length == 0?estilos.deshabilitado:""}
            `}
            disabled = {tactos.length == 0}
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
    {#if tactos.length == 0}
        <p class="mt-5 text-lg">No tiene tactos</p>
    {:else}
    <table class="table table-lg " >
        <thead>
            <tr>
                <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                <th class="text-base mx-1 px-1"  >Observacion</th>
                <th class="text-base mx-1 px-1"  >Categoria</th>
                <th class="text-base mx-1 px-1"  >Preñada</th>
                <th class="text-base mx-1 px-1"  >Tipo</th>
            </tr>
        </thead>
        <tbody>
            {#each tactos as t}
                <tr>
                    <td class="text-base">
                        {`${new Date(t.fecha).toLocaleDateString()}`}
                    </td>
                    <td class="text-base mx-1 px-1">
                        {`${t.observacion}`}
                    </td>
                    <td class="text-base mx-1 px-1">
                        {`${getCategoriaNombre(t.categoria)}`}
                    </td>
                    <td class="text-base mx-1 px-1">
                        {   
                            t.prenada==0?"Vacia":
                            t.prenada==1?"Dudosa":
                            "Preñada"
                        }
                    </td>
                    <td class="text-base mx-1 px-1">
                        {`${getTipoNombre(t.tipo)}`}
                    </td>
                </tr>
                
            {/each}
        </tbody>
    </table>
    {/if}
</div>
<dialog id="expandirTacto" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div
        class="
            modal-box w-11/12  max-w-5xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Tactos</h3>  
        <div class="form-control">
            <table class="table table-lg " >
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                        <th class="text-base mx-1 px-1"  >Observacion</th>
                        <th class="text-base mx-1 px-1"  >Categoria</th>
                        <th class="text-base mx-1 px-1"  >Preñada</th>
                        <th class="text-base mx-1 px-1"  >Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tactos as t}
                        <tr>
                            <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">
                                {`${new Date(t.fecha).toLocaleDateString()}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${t.observacion}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${getCategoriaNombre(t.categoria)}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${t.prenada?"Si":"No"}`}
                            </td>
                            
                            <td class="text-base mx-1 px-1">
                                {`${getTipoNombre(t.tipo)}`}
                            </td>
                        </tr>
                        
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="modal-action justify-start ">
            <button class={`${estilos.basico} ${estilos.medio} ${estilos.secundario}`} onclick={()=>expandirTacto.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
<dialog id="nuevoTactoAnimal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
            <label for = "tipo" class="label">
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
                    bind:value={categoria}
                >
                    {#each tiposanimal as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <div class="form-group">
                <label for = "prenada" class="label">
                    <span class="label-text text-base">Estado</span>
                </label>

                <RadioButton class="m-1 my-3" bind:option={prenada} deshabilitado={false}/>
                
            </div>
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
            <label for = "tipo" class="label">
                <span class="label-text text-base">Tacto/Ecografia</span>
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
                    bind:value={tipo}
                >
                    {#each tipostacto as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <div class="hidden">
            <label for = "vete" class="label">
                <span class="label-text text-base">Veterinario</span>
            </label>
            <label class="input-group">
                <input 
                    id ="vete" 
                    type="text"  
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `}
                    bind:value={nombreveterinario}
                />
            </label>
            </div>
            <label for="obs" class="label">
                <span class="label-text">Observacion</span>                    
            </label>
            <label for="input-group">
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
            </label>
            
        </div>
        <div class="modal-action justify-start ">
            <button class="btn btn-success text-white" onclick={guardarTacto} >Guardar</button>
            <button class="btn btn-error text-white" onclick={()=>nuevoTactoAnimal.close()}>Cancelar</button>
        </div>
    </div>
</dialog>

