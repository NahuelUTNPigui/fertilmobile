<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import tiposanimal from '$lib/stores/tiposanimal';
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let{cabid} = $props()
    let id = $state("")
    let inseminaciones = $state([])
    // La inseminacion es a un animal mujer que luego sera un nacimiento
    let padre = $state("")
    let pajuela = $state("")
    //Seria la fecha del parto
    let fecha = $state("")
    let padres = $state([])
    //Datos de la inseminacion
    let categoria = $state("")
    let fechadesdeins = $state("")
    let fechahastains = $state("")
    function openNewModal(){
        fecha = ""
        padre = ""
        categoria = ""
        fechadesdeins = ""
        fechahastains = ""
        pajuela = ""
        nuevaInseminacionAnimal.showModal()
    }
    async function guardarInseminacion(){
        try{
            let data = {
                cab:cabid,
                animal : id,
                fechaparto:fecha +' 03:00:00',
                fechadesde:fechadesdeins+" 03:00:00",
                fechahasta:fechahastains+" 03:00:00",
                active:true,
                padre,
                pajuela,
                categoria
            }
            const record = await pb.collection('inseminacion').create(data);
            let item = record
            inseminaciones.push(item)
        }
        catch(err){
            console.error(err)
            
        }
        nuevaInseminacionAnimal.close()
    }
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cabid}'`
        })
        padres = recordsa.filter(a=>a.sexo == "M")
    }
    async function getInseminaciones(){
        const records = await pb.collection('inseminacion').getFullList({
            sort: '-created ',
            filter :`animal = '${id}' && active=true`,
            
        });
        inseminaciones = records
    }
    function getNombrePadre(){
        let p = padres.filter(item=>item.id == padre)[0]
        pajuela = p.caravana
    }
    function getCategoriaNombre(cat){
        return tiposanimal.filter(c=>c.id==cat)[0].nombre
    }
    onMount(async ()=>{
        id = $page.params.slug
        await getInseminaciones()
        await getAnimales()
    })
</script>
<div class="w-full flex justify-items-start gap-2">
    <div class="hidden">
        <button
            aria-label="Expandir"
            onclick={()=>expandirInseminacion.showModal()}
            class={`
                ${estilos.basico} ${estilos.chico} ${estilos.primario}
                ${inseminaciones.length == 0?estilos.deshabilitado:""}
            `}
            disabled = {inseminaciones.length == 0}
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
    {#if inseminaciones.length == 0}
        <p class="mt-5 text-lg">No tiene inseminaciones</p>
    {:else}
    <table class="table table-lg" >
        <thead>
            <tr>
                <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha parto</th>
                <th class="text-base mx-1 px-1">Pajuela</th>
                <th class="text-base mx-1 px-1">Categoria</th>
                <th class="text-base mx-1 px-1">Fechas</th>
            </tr>
        </thead>
        <tbody>
            {#each inseminaciones as i}
            <tr>
                <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(i.fechaparto).toLocaleDateString()}</td>
                <td class="text-base mx-1 px-1">
                    {`${i.pajuela}`}
                </td>
                <td class="text-base mx-1 px-1">
                    {`${i.categoria}`}
                </td>
                <td class="text-base mx-1 px-1">
                    {`${new Date(i.fechadesde).toLocaleDateString()} - ${new Date(i.fechahasta).toLocaleDateString()}`}
                </td>
            </tr>
            {/each}
        </tbody>
    </table>
    {/if}
    
</div>
<dialog id="expandirInseminacion" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Inseminaciones</h3>  
        <div class="form-control">
            <table class="table table-lg" >
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha parto</th>
                        <th class="text-base mx-1 px-1">Pajuela</th>
                        <th class="text-base mx-1 px-1">Categoria</th>
                        <th class="text-base mx-1 px-1">Fechas</th>
                    </tr>
                </thead>
                <tbody>
                    {#each inseminaciones as i}
                    <tr>
                        <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(i.fechaparto).toLocaleDateString()}</td>
                        <td class="text-base mx-1 px-1">
                            {`${i.pajuela}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${getCategoriaNombre(i.categoria)}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${new Date(i.fechadesde).toLocaleDateString()} - ${new Date(i.fechahasta).toLocaleDateString()}`}
                        </td>
                    </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="modal-action justify-start ">
            <button class={`${estilos.basico} ${estilos.medio} ${estilos.secundario}`} onclick={()=>expandirInseminacion.close()}>Cerrar</button>
        </div>
    </div>
</dialog>
<dialog id="nuevaInseminacionAnimal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Nueva inseminación</h3>  
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
            <label for = "nombrepadre" class="label">
                <span class="label-text text-base">Pajuela</span>
            </label>
            <label class="input-group">
                <input 
                    id ="nombrepadre" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none 
                        focus:ring-2 focus:ring-green-500 
                        focus:border-green-500
                        w-full 
                        ${estilos.bgdark2} 
                    `}
                    bind:value={pajuela}
                />
            </label>
            <label for = "padre" class="label">
                <span class="label-text text-base">Padre</span>
            </label>
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={padre}
                    onchange={getNombrePadre}
                >
                    {#each padres as p}
                        <option value={p.id}>{p.caravana}</option>    
                    {/each}
                  </select>
            </label>
            <label for = "fechaparto" class="label">
                <span class="label-text text-base">Fecha parto</span>
            </label>
            <label class="input-group ">
                <input id ="fechaparto" type="date" 
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
            <label for = "fechadesde" class="label">
                <span class="label-text text-base">Fecha desde</span>
            </label>
            <label class="input-group ">
                <input id ="fechadesde" type="date" 
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechadesdeins}
                />
            </label>
            <label for = "fechahasta" class="label">
                <span class="label-text text-base">Fecha hasta</span>
            </label>
            <label class="input-group ">
                <input id ="fechaparto" type="date" 
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                    `}
                    bind:value={fechahastains}
                />
            </label>
        </div>
        <div class="modal-action justify-start ">
            <button class="btn btn-success text-white" onclick={guardarInseminacion} >Guardar</button>
            <button class="btn btn-error text-white" onclick={()=>nuevaInseminacionAnimal.close()}>Cancelar</button>
        </div>
    </div> 
</dialog>