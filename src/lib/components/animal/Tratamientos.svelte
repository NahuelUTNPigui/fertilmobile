<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import categorias from "$lib/stores/categorias";
    let{cabid} = $props()
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let id = $state("")
    let tratamientos = $state([])
    let tipotratamientos = $state([])
    //Datos tratamiento
    let categoria = $state("")
    let fecha = $state("")
    let tipo = $state("")
    async function getTiposTratamientos(){
        const records = await pb.collection('tipotratamientos').getFullList({
            filter : `cab='${cabid}' && active = true`,
            sort: '-created',
        });
        tipotratamientos = records
        tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-1)
    }
    async function getTratamientos(){
        const records = await pb.collection('tratamientos').getFullList({
            sort: '-created ',
            filter :`animal = '${id}' && active=true`,
            expand:"tipo"
            
        });
        tratamientos = records
    }
    function openNewModal(){
        categoria = ""
        tipo = ""
        fecha = ""
        nuevoTratamiento.showModal()
    }

    async function guardarTratamiento(){
        try{
            let data = {
                animal:id,
                categoria,
                tipo,
                fecha:fecha +" 03:00:00",
                active : true,
                cab:cabid
            }
            const  record = await pb.collection("tratamientos").create(data)
            let nombretipo = tipotratamientos.filter(tp=>tp.id==tipo)[0].nombre
            let item={
                ...record,
                expand:{
                    tipo:{nombre:nombretipo}
                }
            }
            tratamientos.push(item)
        }
        catch(err){
            console.error(err)
        }
    }
    onMount(async ()=>{
        id = $page.params.slug
        await getTratamientos()
        await getTiposTratamientos()
    })
</script>
<div class="w-full flex justify-items-start gap-2">
    <div class="hidden">
        <button
            aria-label="Expandir"
            onclick={()=>expandirTratamiento.showModal()}
            class={`
                ${estilos.basico} ${estilos.chico} ${estilos.primario}
                ${tratamientos.length == 0?estilos.deshabilitado:""}
            `}
            disabled = {tratamientos.length == 0}
        >
            Expandir                
        </button>
    </div>
    <div>
        <button
            aria-label="Nuevo"
            onclick={()=>openNewModal()}
            class={`
                ${estilos.sinbordes} ${estilos.chico} ${estilos.primario}
            `}
        >
            Nuevo
        </button>
    </div>
</div>
<div class="w-full flex justify-items-center lg:w-3/4 overflow-x-auto">
    {#if tratamientos.length == 0}
        <p class="mt-5 text-lg">No hay tratamientos</p>
    {:else}
        <table class="table table-lg" >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                    <th class="text-base mx-1 px-1">Tratamiento</th>
                    <th class="text-base mx-1 px-1">Categoria</th>
                </tr>
            </thead>
            <tbody>
                {#each tratamientos as t}
                <tr>
                    <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(t.fecha).toLocaleDateString()}</td>
                    <td class="text-base mx-1 px-1">
                        {t.expand.tipo.nombre}
                    </td>
                    <td class="text-base mx-1 px-1">{t.categoria}</td>

                </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
<dialog id="expandirTratamiento" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Tratamientos</h3>  
        <div class="form-control">
            <table class="table table-lg" >
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                        <th class="text-base mx-1 px-1">Tratamiento</th>
                        <th class="text-base mx-1 px-1">Categoria</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tratamientos as t}
                    <tr>
                        <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(t.fecha).toLocaleDateString()}</td>
                        <td class="text-base mx-1 px-1">
                            {t.expand.tipo.nombre}
                        </td>
                        <td class="text-base mx-1 px-1">{t.categoria}</td>
    
                    </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="modal-action justify-start ">
            <button class={`${estilos.basico} ${estilos.medio} ${estilos.secundario}`} onclick={()=>expandirTratamiento.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
<dialog id="nuevoTratamiento" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
    <div 
        class="
            modal-box w-11/12 max-w-xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
        "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Nueva tratamiento</h3>  
        <div class="form-control">
            <label for = "fecha" class="label">
                <span class="label-text text-base">Fecha</span>
            </label>
            <label class="input-group ">
                <input id ="fecha" type="date" max={HOY}  
                    class={`
                        input input-bordered w-full
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
                    bind:value={categoria}
                >
                    {#each categorias as c}
                        <option value={c.id}>{c.nombre}</option>    
                    {/each}
                  </select>
            </label>
            <label for = "tipo" class="label">
                <span class="label-text text-base">Tipo tratamiento</span>
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
                    {#each tipotratamientos as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                  </select>
            </label>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog">
                <button class="btn btn-success text-white" onclick={guardarTratamiento} >Guardar</button>
                <button class="btn btn-error text-white">Cancelar</button>
            </form>
        </div>
    </div>
</dialog>