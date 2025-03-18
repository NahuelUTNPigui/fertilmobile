<script>
    import estilos from "$lib/stores/estilos";
    import sexos from "$lib/stores/sexos";
    import { page } from '$app/stores';
    import { onMount } from "svelte";
    import { createCaber } from '$lib/stores/cab.svelte';
    import {createUserer} from "$lib/stores/user.svelte"
    import { goto } from "$app/navigation";
    import PocketBase from 'pocketbase'
    import Swal from "sweetalert2";
    import categorias from "$lib/stores/categorias";
    import estados from "$lib/stores/estados";
    import RadioButton from "$lib/components/RadioButton.svelte";
    import { createPer } from "$lib/stores/permisos.svelte";
    import { getPermisosList } from "$lib/permisosutil/lib";
    import { guardarHistorial } from "$lib/historial/lib";
    import PredictSelect from "../PredictSelect.svelte";
    let {
        caravana,
        rodeo,
        lote,
        connacimiento,
        peso,
        sexo,
        nacimiento,
        fechanacimiento,
        categoria,
        prenada,
        modohistoria=$bindable()
    } = $props()
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    let caber = createCaber()
    let userer = createUserer()
    let cab = caber.cab
    let per = createPer()
    let userpermisos = getPermisosList(per.per.permisos)
    let userid = userer.userid
    let id = $state("")
    let nombrerodeo = $state("")
    let nombrelote = $state("")
    let modoedicion = $state(false)
    let cargadoanimales = $state(false)
    //Datos edicion
    let pesoviejo = $state("")
    let sexoviejo = $state("")
    let caravanavieja = $state("")
    let rodeovieja = $state("")
    let loteviejo = $state("")
    let categoriavieja = $state("")
    let prenadaviejo = $state(false)

    //Nacimiento
    let fechaviejo = $state("")
    let nombremadreviejo = $state("")
    let nombrepadreviejo = $state("")
    let padreviejo = $state("")
    let madreviejo = $state("")
    let observacionviejo = $state("")
    
    //Datos nacimiento
    let idnacimiento = $state("")
    let padre = $state("")
    let madre = $state("")
    let nombremadre = $state("")
    let nombrepadre = $state("")
    let fecha = $state("")
    let madres = $state([])
    let padres = $state([])
    let listamadres = $state([])
    let listapadres = $state([])
    let tipomadre = $state("")
    
    let observacion = $state("") 
    let rodeos = $state([])
    let lotes = $state([])
    
    function onwrite(){

    }
    function onelegir(){
        
    }
    //rodeos
    async function getRodeos(){
        const records = await pb.collection('rodeos').getFullList({
            filter:`active = true && cab ='${cab.id}'`,
            sort: '-nombre',
        });
        rodeos = records
        if(rodeo != ""){
            nombrerodeo = rodeos.filter(t=>t.id==rodeo)[0].nombre
        }
        else{
            nombrerodeo = ""
        }
    }
    //Lotes
    async function getLotes(){
        const records = await pb.collection('lotes').getFullList({
            filter:`active = true && cab ='${cab.id}'`,
            sort: '-nombre',
        });
        lotes = records
        if(lote != ""){
            nombrelote = lotes.filter(l=>l.id==lote)[0].nombre
        }
        else{
            nombrelote = ""
        }
    }
    //Animales
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && cab='${cab.id}' `,
            expand:"nacimiento"
        })
        madres = recordsa.filter(a=>a.sexo == "H" && a.delete==false)
        padres = recordsa.filter(a=>a.sexo == "M" && a.delete==false)
        listamadres = madres.map(item=>{
            return {
                id:item.id,nombre:item.caravana
            }
        })
        listapadres = padres.map(item=>{
            return {
                id:item.id,nombre:item.caravana
            }
        })
        cargadoanimales = true
    }
    function getSexo(sex){
        let obj = sexos.filter(s => s.id == sex)[0]
        if(obj){
            return obj.nombre
        }
        else{
            return ""
        }        
    }
    function getFechaNacimiento(nacimiento){
        if(nacimiento){
            return new Date(nacimiento.fecha).toLocaleDateString()
        }
        else{
            return false
        }
    }
    function openEditar(){
        if(userpermisos[5]){
            modoedicion = true
            pesoviejo = peso
            sexoviejo = sexo
            loteviejo = lote
            rodeovieja = rodeo
            caravanavieja = caravana
            categoriavieja = categoria
            prenadaviejo  = prenada
        }
        else{
            Swal.fire("Sin permisos","No tienes permisos para administrar animales","error")
        }
        
    }
    function cancelarEditar(){
        modoedicion = false
        peso = pesoviejo
        sexo = sexoviejo
        caravana = caravanavieja
        rodeo = rodeovieja
        lote = loteviejo
        categoria = categoriavieja
        prenada = prenadaviejo
        if(rodeo != ""){
            nombrerodeo = rodeos.filter(t=>t.id==rodeo)[0].nombre
        }
        else{
            nombrerodeo = ""
        }
        if(lote != ""){
            nombrelote = lotes.filter(l=>l.id==lote)[0].nombre
        }
        else{
            nombrelote = ""
        }
    }
    function openNewModal(){
        if(userpermisos[5]){
            fecha  = fechanacimiento
            nuevoModal.showModal()
        }
        else{
            Swal.fire("Sin permisos","No tienes permisos para administrar animales","error")
        }
    }
    function openEditModal(){
        if(userpermisos[5]){
        fechaviejo =  fecha
        nombremadreviejo = nombremadre
        nombrepadreviejo = nombrepadre
        madreviejo = madre
        padreviejo = padre
        observacionviejo = observacion
        
        nuevoModal.showModal()
        }
        else{
            Swal.fire("Sin permisos","No tienes permisos para administrar animales","error")
        }
        
    }
    async function guardarNaciminento(){
        try{
            let dataparicion = {
                madre,
                padre,
                fecha:fecha + " 03:00:00",
                nombremadre,
                nombrepadre,
                observacion,
                cab:cab.id
            }
            const recordparicion = await pb.collection('nacimientos').create(dataparicion);
            let datanimal = {
                nacimiento:recordparicion.id,
                fechanacimiento:fecha + " 03:00:00",
            }
            let datahistorial = {
                prenada,
                sexo,
                peso,
                caravana,
                active:true,
                delete: false,
                fechanacimiento:fechaviejo+ " 03:00:00",
                lote,
                rodeo,
                user:userid,
                categoria,
                animal:id
            }
            const record = await pb.collection('animales').update(id, datanimal);
            //NO va porque tengo que evaluar las fechas
            await pb.collection("historialanimales").create(datahistorial)
            await guardarHistorial(pb,madre)
            let datamadre = {
                prenada : 0
            }
            if(tipomadre == "vaquillona"){
                datamadre.categoria = "vaca"
                
            }
            
            await pb.collection('animales').update(madre, datamadre);
            Swal.fire("Éxito guardar","Se pudo guardar el nacimiento","success")
            connacimiento = true
            nacimiento = recordparicion
        }
        catch(err){
            console.error(err)
            Swal.fire("Error guardar","No se pudo guardar el nacimiento","error")
        }
    }
    async function editarNacimiento(){
        let data = {
            madre,
            padre,
            fecha:fecha + " 03:00:00",
            nombremadre,
            nombrepadre,
            observacion,
        }
        let datahistorial = {
            prenada,
            sexo,
            peso,
            caravana,
            active:true,
            delete: false,
            fechanacimiento:fechaviejo+ " 03:00:00",
            lote,
            rodeo,
            user:userid,
            categoria,
            animal:id
        }
        try{
            const recordparicion = await pb.collection('nacimientos').update(idnacimiento,data);
            await pb.collection("historialanimales").create(datahistorial)
            
        }
        catch(err){
            console.error(err)
        }
    }
    function getNombreMadre(){
        let m = madres.filter(item=>item.id == madre)[0]
        nombremadre = m.caravana
        
        tipomadre = m.categoria
        
    }
    function getNombrePadre(){
        let p = padres.filter(item=>item.id == padre)[0]
        nombrepadre = p.caravana
    }
    async function editarAnimal(){
        let data = {
            peso,
            sexo,
            caravana,
            rodeo:rodeo,
            lote,
            prenada,
            categoria
        }
        let datahistorial = {
            prenada:prenadaviejo,
            sexo:sexoviejo,
            peso:pesoviejo,
            caravana:caravanavieja,
            active:true,
            delete: false,
            fechanacimiento:fecha+ " 03:00:00",
            lote:loteviejo,
            rodeo:rodeovieja,
            user:userid,
            categoria:categoriavieja,
            animal:id
        }
        try{
            const record = await pb.collection('animales').update(id, data);
            
            await pb.collection("historialanimales").create(datahistorial)
            sexo = data.sexo
            peso = data.peso
            caravana = data.caravana
            rodeo = data.rodeo
            lote = data.lote
            categoria = data.categoria
            prenada = data.prenada
            if(rodeo != ""){
                nombrerodeo = rodeos.filter(t=>t.id==rodeo)[0].nombre
            }
            else{
                nombrerodeo = ""
            }
            if(lote != ""){
                nombrelote = lotes.filter(l=>l.id==lote)[0].nombre
            }
            else{
                nombrelote = ""
            }
            Swal.fire("Éxito editar","Se pudo editar el animal","success")
            modoedicion = false

        }catch(err){
            console.error(err)
            Swal.fire("Error editar","No se pudo editar el animal","error")
        }
    }
    function cerrarModal(){
        fecha = ""
        nombremadre = ""
        nombrepadre = ""
        madre = ""
        padre = ""
        observacion = ""
        categoria = ""
        
        if (connacimiento){
            fecha =  fechaviejo
            nombremadre = nombremadreviejo
            nombrepadre = nombrepadreviejo
            madre = madreviejo
            padre = padreviejo
            observacion = observacionviejo
            
        }
        nuevoModal.close()
    }
    onMount(async ()=>{
        id = $page.params.slug
        
        await getAnimales()
        await getRodeos()
        await getLotes()
        if(connacimiento){
            idnacimiento = nacimiento.id
            fecha = nacimiento.fecha.split(" ")[0]
            nombremadre = nacimiento.nombremadre
            nombrepadre = nacimiento.nombrepadre
            padre = nacimiento.padre
            madre = nacimiento.madre

            observacion = nacimiento.observacion
        }
    })
    //cancelar class="btn btn-error text-white font-medium text-lg "
    //Editar animal class="btn text-lg px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
</script>
<div class="grid grid-cols-2 lg:grid-cols-3">
    <button
        onclick={()=>goto("/animales")}
    >
                  
        <h2 class="flex text-2xl mx-1 font-bold mb-2 text-left mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 mt-1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Caravana: {caravana}
        </h2>
    </button>
    <div class="flex w-11/12">
        <button
            onclick={openEditar}
            class={`
                ${estilos.basico} ${estilos.chico}
                ${estilos.btnsecondary}
                ${modoedicion?"hidden":""}
                `}
                aria-label="Editar"
        >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
          
        </button>    
    </div>
</div>

<div class="grid grid-cols-2 gap-1 lg:gap-6 mx-1 mb-2">
    <div class="mb-1 lg:mb-0">
        <label for = "peso" class="label">
            <span class="label-text text-base">Peso(KG)</span>
        </label>
        {#if modoedicion}
            <label class="input-group">
                <input id ="peso" type="number"  
                    class={`input input-bordered w-full ${estilos.bgdark2}`}
                    bind:value={peso}
                />
            </label>
        {:else}
            <label for="nombre" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
            >
                {peso}
            </label>
        {/if}
    </div>
    <div class="mb-1 lg:mb-0">
        <label for = "sexo" class="label">
            <span class="label-text text-base">Sexo</span>
        </label>
        {#if modoedicion}
            
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `} bind:value={sexo}>
                    {#each sexos as s}
                        <option value={s.id}>{s.nombre}</option>    
                    {/each}
                </select>
            </label>
        {:else}
            
            <label for="sexo" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
            >
                {getSexo(sexo)}
            </label>
        {/if}
    </div>
    <div class="mb-1 lg:mb-0">
        <label for = "rodeo" class="label">
            <span class="label-text text-base">Rodeo</span>
        </label>
        {#if modoedicion}
            
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `} bind:value={rodeo}>
                    {#each rodeos as t}
                        <option value={t.id}>{t.nombre}</option>    
                    {/each}
                </select>
            </label>
        {:else}
            
            <label for="rodeo" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
            >
                {nombrerodeo}
            </label>
        {/if}
    </div>
    <div class="mb-1 lg:mb-0">
        <label for = "lote" class="label">
            <span class="label-text text-base">Lote</span>
        </label>
        {#if modoedicion}
            
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `} bind:value={lote}>
                    {#each lotes as l}
                        <option value={l.id}>{l.nombre}</option>    
                    {/each}
                </select>
            </label>
        {:else}
            
            <label for="lote" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
            >
                {nombrelote}
            </label>
        {/if}
    </div>
    <div class="mb-1 lg:mb-0">
        <label for = "categoria" class="label">
            <span class="label-text text-base">Categoria</span>
        </label>
        {#if modoedicion}
            
            <label class="input-group ">
                <select 
                    class={`
                        select select-bordered w-full
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 
                        focus:ring-green-500 focus:border-green-500
                        ${estilos.bgdark2}
                    `} bind:value={categoria}>
                    {#each categorias as l}
                        <option value={l.id}>{l.nombre}</option>    
                    {/each}
                </select>
            </label>
        {:else}
            
            <label for="lote" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-1`}
            >
                {categoria}
            </label>
        {/if}
    </div>
    {#if sexo == "H"}
        <div class="mb-1 lg:mb-0 col-span-2 lg:w-1/2">
            <label for = "prenada" class="label">
                <span class="label-text text-base">Estado</span>
            </label>
            {#if modoedicion}
                
                <RadioButton bind:option={prenada} deshabilitado={false}/>
            {:else}
                <RadioButton bind:option={prenada} deshabilitado={true}/>
                
            {/if}
        </div>
    {/if}
    
    {#if modoedicion}
        <div class="mb-1 lg:mb-0">
            <label for = "caravana" class="label">
                <span class="label-text text-base">Caravana</span>
            </label>
            <label class="input-group">
                <input id ="caravana" type="text"  
                    class={`input input-bordered w-full ${estilos.bgdark2}`}
                    bind:value={caravana}
                />
            </label>
        </div>
    {/if}
</div>
<div class="mt-3 flex justify-start gap-2 ">
    {#if modoedicion}
        <div class="grid grid-cols-2 gap-3">
            <div>
                <button
                    aria-label="guardar"
                    onclick={editarAnimal}
                    class={`
                        ${estilos.basico} ${estilos.chico} ${estilos.primario}
                    `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="size-4" viewBox="0 0 16 16">
                            <path d="M11 2H9v3h2z"/>
                            <path d="M1.5 0h11.586a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13A1.5 1.5 0 0 1 1.5 0M1 1.5v13a.5.5 0 0 0 .5.5H2v-4.5A1.5 1.5 0 0 1 3.5 9h9a1.5 1.5 0 0 1 1.5 1.5V15h.5a.5.5 0 0 0 .5-.5V2.914a.5.5 0 0 0-.146-.353l-1.415-1.415A.5.5 0 0 0 13.086 1H13v4.5A1.5 1.5 0 0 1 11.5 7h-7A1.5 1.5 0 0 1 3 5.5V1H1.5a.5.5 0 0 0-.5.5m3 4a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V1H4zM3 15h10v-4.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5z"/>
                        </svg>
                </button>
            </div>
            <div>
                <button 
                    aria-label="cancelar"
                    onclick={cancelarEditar}
                    class={`
                        ${estilos.basico} ${estilos.chico} ${estilos.danger}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  
                </button>   
            </div>
            
            
        </div>
    {/if}
</div>
{#if connacimiento}
    <div class="grid grid-cols-2 lg:grid-cols-3">
        <h3 class="text-2xl font-bold mt-2 mb-1 text-left">
            Nacimiento
        </h3>
        <div class="flex w-11/12">
            <button
                onclick={openEditModal}
                class={`
                    ${estilos.basico} ${estilos.chico}
                    ${estilos.btnsecondary}
                    
                    `}
                    aria-label="Editar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              
            </button>    
        </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-1 gap-1 lg:gap-6 mb-2">
        <div>
            <label for = "fechanacimiento" class="label">
                <span class="label-text text-base">Fecha</span>
            </label>
            <label for="fechanacimiento" 
                class={`block text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 p-2`}
            >
                {new Date(fecha+" 03:00:00").toLocaleDateString()}
            </label>
        </div>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-2 gap-1 lg:gap-6 mx-1 mb-2">
        <div>
            <label for = "nombremadre" class="label">
                <span class="label-text text-base">Nombre madre</span>
            </label>
            <label for="nombremadre" 
                class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                {nombremadre}
            </label>
        </div>
        <div>
            <label for = "nombrepadre" class="label">
                <span class="label-text text-base">Nombre padre</span>
            </label>
            <label for="nombrepadre" 
                class={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1`}
            >
                {nombrepadre}
            </label>
        </div>
    </div>
    
    
{:else}
    <div>
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-10 m-1  mb-2 lg:mt-2" >
            <h3 class="text-xl mx-1 font-bold mb-1 text-left">
                No tiene un nacimiento registrado
            </h3>
            <button class={`w-11/12  ${estilos.basico} ${estilos.medio} ${estilos.primario}`} onclick={()=>openNewModal()}>
                <span class="text-lg">Crear nacimiento</span>
            </button>
            
            
        </div>
        
    </div>
{/if}
<div class="grid grid-cols-3 mx-0  mt-1 ">
    
    <div class="flex col-span-2 gap-1 justify-start">
        <button aria-label="historiaclinica" class={` btn rounded-lg ${estilos.basico} ${estilos.primario} px-2 mx-1`} onclick={()=>modohistoria = !modohistoria}>
            <span  class="text-lg m-1">{modohistoria?"Ocultar":"Mostrar"} historia clinica</span>      
        </button>
    </div>  
</div>

<dialog id="nuevoModal" class="modal modal-top mt-10 ml-5 lg:items-start rounded-xl lg:modal-middle">
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
        {#if connacimiento}
            <h3 class="text-lg font-bold">Editar nacimiento</h3>
        {:else}
            <h3 class="text-lg font-bold">Nuevo nacimiento</h3>
        {/if}
        <div class="form-control">    
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
            <div class="hidden">
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
            </div>
            <div class="hidden">
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
            </div>
            {#if cargadoanimales}
                <PredictSelect bind:valor={madre} etiqueta = {"Madre"} bind:cadena={nombremadre} lista = {listamadres} {onelegir} {onwrite}/>
                <PredictSelect bind:valor={padre} etiqueta = {"Padre"} bind:cadena={nombrepadre} lista = {listapadres} {onelegir} {onwrite}/>
            {/if}
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
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <!-- if there is a button, it will close the modal -->
                {#if connacimiento}
                    <button class="btn btn-success text-white" onclick={editarNacimiento} >Editar</button>
                {:else}
                    <button class="btn btn-success text-white" onclick={guardarNaciminento} >Guardar</button>
                {/if}
              
              <button class="btn btn-error text-white" onclick={cerrarModal}>Cancelar</button>
            </form>
        </div>
    </div>
</dialog>
