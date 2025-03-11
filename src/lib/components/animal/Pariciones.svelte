<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import sexos from "$lib/stores/sexos";
    import estilos from "$lib/stores/estilos";
    import PocketBase from 'pocketbase'
    import Swal from "sweetalert2";
    let {cabid,sexoanimal,prenada=$bindable(0)} = $props()
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let buscar = $state("")
    let fechadesde = $state("")
    let fechahasta = $state("")
    let pariciones = $state([])
    let id = $state("")
    //Datos nacimiento
    let nacimiento = $state(null)
    let idnacimiento = $state("")
    let caravana = $state("")
    let sexo = $state("")
    let padre = $state("")
    let madre = $state("")
    let peso = $state("")
    let nombremadre = $state("")
    let nombrepadre = $state("")
    let fecha = $state("")


    let madres = $state([])
    let padres = $state([])
    let idanimal = $state("")
    let observacion = $state("")
    
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`delete=false && cab='${cabid}'`,
            expand:"nacimiento"
        })
        madres = recordsa.filter(a=>a.sexo == "H" || a.sexo == "F")
        padres = recordsa.filter(a=>a.sexo == "M")
    }

    async function getPariciones(){
        const recordsn = await pb.collection("nacimientosall").getFullList({
            filter:`(padre~'${id}' || madre ~ '${id}') && cab='${cabid}' `,
            sort:"-fecha"
        })
        pariciones = recordsn
    }
    async function guardarParicion(){
        try{
            let dataparicion = {
                madre,
                padre,
                fecha:fecha + " 03:00:00",
                nombremadre,
                nombrepadre,
                observacion,
                cab:cabid
            }
            const recordparicion = await pb.collection('nacimientos').create(dataparicion);
            let data = {
                caravana,
                active:true,
                delete:false,
                fechanacimiento:fecha +" 03:00:00",
                sexo,
                cab:cabid,
                peso,
                nacimiento:recordparicion.id
            }
            let recorda = await pb.collection('animales').create(data); 
            Swal.fire("Éxito guardar","Se pudo guardar la paricion con exito","success")
            prenada = 0
            await getPariciones()
        }
        catch(err){
            console.error(err)
        }
    }
    onMount(async ()=>{
        id = $page.params.slug
        await getPariciones()
        await getAnimales()
        if(sexoanimal == "F" || sexoanimal == "H"){
            let m = madres.filter(item=>item.id == id)[0]
            
            nombremadre = m.caravana
            madre = id
        }
        else{
            let p = padres.filter(item=>item.id == id)[0]
            nombrepadre = p.caravana
            padre = id
        }
        
    })
    
    function getNombreMadre(){
        let m = madres.filter(item=>item.id == madre)[0]
        nombremadre = m.caravana
    }
    function getNombrePadre(){
        let p = padres.filter(item=>item.id == padre)[0]
        nombrepadre = p.caravana
    }
    function openNewModal(){
        
        caravana = ""
        sexo = ""
        fecha = ""
        observacion = ""
        peso=""
        if(sexoanimal == "M"){
            madre = ""
            nombremadre = ""
        }
        else{
            padre = ""
            nombrepadre = ""
        }
        nuevaParicion.showModal()
    }
</script>
<div class="w-full flex justify-items-start gap-2">
    <div class="hidden">
        <button
            aria-label="Expandir"
            onclick={()=>expandir.showModal()}
            class={`
                ${estilos.basico} ${estilos.chico} ${estilos.primario} ${pariciones.length == 0?estilos.deshabilitado:""}
            `}
            disabled = {pariciones.length == 0}
        >
            Expandir                
        </button>
    </div>
    <div>
        <button
            aria-label="Nuevo"
            onclick={openNewModal}
            class={`
                ${estilos.basico} ${estilos.chico} ${estilos.primario}
            `}
        >
            Nuevo
        </button>
    </div>
</div>
<div class="w-full flex justify-items-center mx-1 lg:w-3/4 overflow-x-auto">
    {#if pariciones.length == 0}
        <p class="mt-5 text-lg">No hay pariciones</p>
    {:else}
        <table class="table table-lg " >
            <thead>
                <tr>
                    <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                    <th class="text-base mx-1 px-1">Caravana</th>
                    <th class="text-base mx-1 px-1">Madre</th>
                    <th class="text-base mx-1 px-1">Padre</th>
                    <th class="text-base mx-1 px-1">Observacion</th>
                    
                    
                </tr>
            </thead>
            <tbody>
                {#each pariciones as n}
                    <tr>
                        <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(n.fecha).toLocaleDateString()}</td>
                        <td class="text-base mx-1 px-1">
                            {`${n.caravana}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${n.nombremadre}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${n.nombrepadre}`}
                        </td>
                        <td class="text-base mx-1 px-1">
                            {`${n.observacion}`}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
    
</div>
<dialog id="expandir" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Pariciones</h3>  
        <div class="form-control">
            <table class="table table-lg " >
                <thead>
                    <tr>
                        <th class="text-base ml-3 pl-3 mr-1 pr-1 ">Fecha</th>
                        <th class="text-base mx-1 px-1">Caravana</th>
                        <th class="text-base mx-1 px-1">Madre</th>
                        <th class="text-base mx-1 px-1">Padre</th>
                        <th class="text-base mx-1 px-1">Observacion</th>
                        
                        
                    </tr>
                </thead>
                <tbody>
                    {#each pariciones as n}
                        <tr>
                            <td class="text-base ml-3 pl-3 mr-1 pr-1 lg:ml-10">{new Date(n.fecha).toLocaleDateString()}</td>
                            <td class="text-base mx-1 px-1">
                                {`${n.caravana}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${n.nombremadre}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${n.nombrepadre}`}
                            </td>
                            <td class="text-base mx-1 px-1">
                                {`${n.observacion}`}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="modal-action justify-start ">
            <button class={`${estilos.basico} ${estilos.medio} ${estilos.secundario}`} onclick={()=>expandir.close()}>Cerrar</button>
        </div>


    </div>

</dialog>
<dialog id="nuevaParicion" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        <h3 class="text-lg font-bold">Nueva parición</h3>  
        <div class="form-control">
            <label for = "nombre" class="label">
                <span class="label-text text-base">Caravana</span>
            </label>
            <label class="input-group">
                <input id ="nombre" type="text"  
                    class={`
                        input input-bordered 
                        w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 
                        focus:border-green-500
                        ${estilos.bgdark2} 
                        
                    `}
                    disabled={idnacimiento!=""}
                    bind:value={caravana}
                />
            </label>
            <label for = "sexo" class="label">
                <span class="label-text text-base">Sexo</span>
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
                    bind:value={sexo}
                >
                    {#each sexos as s}
                        <option value={s.id}>{s.nombre}</option>    
                    {/each}
                </select>
            </label>
            <label for = "peso" class="label">
                <span class="label-text text-base">Peso (KG)</span>
            </label>
            <label class="input-group">
                <input id ="peso" type="number"  
                    class={`
                        input input-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2} 
                    `} 
                    bind:value={peso}
                />
            </label>
            <label for = "fechanacimiento" class="label">
                <span class="label-text text-base">Fecha nacimiento</span>
            </label>
            <label class="input-group ">
                <input id ="fechanacimiento" type="date" max={HOY}  
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
            {#if sexoanimal == "M"}
                <label for = "nombremadre" class="label">
                    <span class="label-text text-base">Nombre madre</span>
                </label>
                <label class="input-group">
                    <input 
                        id ="nombremadre" 
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
                        bind:value={nombremadre}
                    />
                </label>
                <label for = "madre" class="label">
                    <span class="label-text text-base">Madre</span>
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
                        bind:value={madre}
                        onchange={getNombreMadre}
                    >
                        {#each madres as m}
                            <option value={m.id}>{m.caravana}</option>    
                        {/each}
                    </select>
                </label>
            {:else}
                <label for = "nombrepadre" class="label">
                    <span class="label-text text-base">Nombre padre</span>
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
                        bind:value={nombrepadre}
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
            {/if}
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
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->              
                <button class="btn btn-success text-white" onclick={guardarParicion} >Guardar</button>
                <button class="btn btn-error text-white" >Cancelar</button>
            </form>
        </div>
    </div>

</dialog>

