<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import tiposanimal from '$lib/stores/tiposanimal';
    import { guardarHistorial } from "$lib/historial/lib";
    import PredictSelect from "../PredictSelect.svelte";
    import { getWholeWordButLastLetter,addDays } from '$lib/stringutil/lib';
    import MultipleToros from "../MultipleToros.svelte";
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    let{cabid,categoria,prenadaori = $bindable(0)} = $props()
    let id = $state("")
    let servicios = $state([])
    // La inseminacion es a un animal mujer que luego sera un nacimiento
    let pajuela = $state("")
    let cargado = $state(false)
    //Seria la fecha del parto
    let fecha = $state("")
    let padres = $state([])
    let padreser = $state("")
    let listapadres = $state([])
    //Datos de la inseminacion
    let fechadesdeser = $state("")
    let fechahastaser = $state("")
    let observacion = $state("")
    function openNewModal(){
        fecha = ""
        
        pajuela = ""
        fechadesdeser = ""
        fechahastaser = ""
        padreser = ""
        listapadres = []
        
        nuevoServicioModal.showModal()
    }
    async function getServicios() {
        const records = await pb.collection('servicios').getFullList({
            sort: '-fechadesde ',
            filter :`cab = '${cabid}' && active = true && madre = '${id}'`,
            expand:"madre"
        });
        servicios = records
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
    async function guardarServicio(){
        let data = {
            fechadesde : fechadesdeser + " 03:00:00",
            fechaparto: fecha + " 03:00:00",
            observacion: bservacion,
            madre:id,
            padres:padreslist.join(),
            active:true,
            cab:cab.id
        }
        if(fechahastaserv != ""){
            dataser.fechahasta = fechahastaser + " 03:00:00"
        }
        try{
            const record = await pb.collection('servicios').create(data);
            prenadaori = 3
            guardarHistorial(pb,id)
            await pb.collection('animales').update(id,{prenada:3})

            await getServicios()
            Swal.fire("Éxito servicio","Se logró guardar el servicio","success")
        }
        catch(err){
            Swal.fire("Error servicio","Hubo un error al guardar el servicio","error")
        }
    }
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cabid}'`
        })
        padres = recordsa.filter(a=>a.sexo == "M")
        listapadres = padres.map(item=>{
            return {
                id:item.id,
                nombre:item.caravana,
                caravana:item.caravana  
            }
        })
        
        cargado = true
    }
    function getNombrePadres(p_padres){
        let ids = p_padres.split(",")
        
        let nombres = ids.reduce(
            (acc,valor)=>padres.filter(p=>p.id==valor)[0].caravana + " , " +acc,
            ""
        )

        return getWholeWordButLastLetter(nombres)

    }
    onMount(async ()=>{
        id = $page.params.slug
        await getServicios()
        await getAnimales()
    })
</script>
<div class="w-full flex justify-items-start gap-2">
    
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
    {#if servicios.length == 0}
        <p class="mt-5 text-lg">No tiene servicios</p>
    {:else}
    <table class="table table-lg" >
        <thead>
            <tr>
                <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha desde</th>
                <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha hasta</th>
                <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha parto</th>
                <th class="text-base mx-1 px-1">Padres</th>
            </tr>
        </thead>
        <tbody>
            {#each servicios as s}
            <tr>
                <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(s.fechadesde).toLocaleDateString()}</td>
                <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{s.fechahasta?new Date(s.fechadesde).toLocaleDateString():""}</td>
                <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(s.fechaparto).toLocaleDateString()}</td>
                <th class="text-base mx-1 px-1">getNombrePadres(s.padres)</th>
            </tr>
            {/each}
        </tbody>
    </table>
    {/if}
</div>
<dialog id="nuevoServicioModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Nuevo servicio</h3>
        <div class="form-control">
            <div>
                <label for = "nombre" class="label">
                    <span class="label-text text-base">Fecha desde</span>
                </label>
                <label class="input-group ">
                    <input id ="fecha" type="date" 
                        class={`
                            input input-bordered 
                            w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2}
                        `} 
                        bind:value={fechahastaser}
                        
                    />
                    
                </label>
            </div>
            <div>
                <label for = "nombre" class="label">
                    <span class="label-text text-base">Fecha hasta</span>
                </label>
                <label class="input-group ">
                    <input id ="fecha" type="date" 
                        class={`
                            input input-bordered 
                            w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2}
                        `} 
                        bind:value={fechahastaser}
                        
                    />
                    
                </label>
            </div>
            <div>
                <label for = "nombre" class="label">
                    <span class="label-text text-base">Fecha parto</span>
                </label>
                <label class="input-group ">
                    <input id ="fecha" type="date" 
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
            </div>
            <div>
                <label for = "nombre" class="label">
                    <span class="label-text text-base">Padres</span>
                </label>
                <label class="input-group ">
                    {#if cargado}
                        
                        <MultipleToros 
                            toros={padres} 
                            bind:valor={padreser} 
                            bind:listavalores={listapadres} 
                        />
                        
                    {/if}
                </label>
            </div>
            <div>
                <label class="form-control">
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
                </label>
            </div>
        </div>
        <div class="modal-action justify-start ">
            <button class="btn btn-success text-white" onclick={guardarServicio} >Guardar</button>
            <button class="btn btn-error text-white" onclick={()=>nuevoServicioModal.close()}>Cancelar</button>
        </div>
    </div>
    
</dialog>