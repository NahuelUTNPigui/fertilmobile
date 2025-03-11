<script>
    import { goto } from "$app/navigation";
    import Navbarr from "$lib/components/Navbarr.svelte";
    import PocketBase from 'pocketbase'
    import Swal from 'sweetalert2';
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import estilos from '$lib/stores/estilos';
    import estados from "$lib/stores/estados";
    import { createCaber } from '$lib/stores/cab.svelte';
    import categorias from "$lib/stores/categorias";
    import sexos from "$lib/stores/sexos";
    import {capitalize} from "$lib/stringutil/lib"
    import {guardarHistorial} from "$lib/historial/lib"
    import MultiSelect from "$lib/components/MultiSelect.svelte";
    let ruta = import.meta.env.VITE_RUTA
    const pb = new PocketBase(ruta);
    const HOY = new Date().toISOString().split("T")[0]
    const today = new Date();
    const DESDE = new Date(today.getFullYear(), today.getMonth() - 1, 1);    
    const HASTA = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    let caber = createCaber()
    let cab = caber.cab
    //boton
    let textoboton = $state("Tratamientos")
    //Datos animales
    let animales = $state([])
    let animalesrows = $state([])
    //Filtros
    let buscar = $state("")
    let lote = $state("")
    let rodeo = $state("")
    let loteseleccion = $state([])
    let rodeoseleccion = $state([])
    let categoria = $state("")
    let sexo = $state("H")

    let lotes = $state([])
    let rodeos = $state([])
    let isOpenFilter = $state(false)
    let tipotratamientos = $state([])

    //Seleccionados
    let selectanimales = $state([])
    let selecthashmap = $state({})
    let todos = $state(false)
    let algunos = $state(false)
    let ninguno = $state(true)

    //movimiento
    let fecha = $state("")
    let tipotratamientoselect = $state("")
    let observaciongeneral = $state("")

    //validacion
    let malfecha = $state(false)
    let maltipo = $state(false)
    let botonhabilitado = $state(false)

    function clickFilter(){
        isOpenFilter = !isOpenFilter
    }
    function limpiar(){
        selectanimales = []
        let lista = []
        for (const [key, value ] of Object.entries(selecthashmap)) {
            lista.push(key)
        }
        for(let i = 0;i<lista.length;i++){
            selecthashmap[lista[i]] = null
        }
        algunos = false
        todos = false
        ninguno = true
    }
    function filterUpdate(){
        
        animalesrows = animales
        if(buscar != ""){
            animalesrows = animalesrows.filter(a=>a.caravana.toLocaleLowerCase().includes(buscar.toLocaleLowerCase()))
        }
        if(sexo != ""){
            animalesrows = animalesrows.filter(a=>a.sexo == sexo)
        }
        if(rodeo != ""){
            animalesrows = animalesrows.filter(a=>a.rodeo == rodeo)
        }
        if(lote != ""){
            animalesrows = animalesrows.filter(a=>a.lote == lote)
        }
        if(categoria != ""){
            animalesrows = animalesrows.filter(a=>a.categoria == categoria)
        }

    }
    function ordenarNombre(lista){
        lista.sort((r1,r2)=>r1.nombre.toLocaleLowerCase()>r2.nombre.toLocaleLowerCase()?1:-1)
    }

    function clickAnimal(id){
        if(selecthashmap[id]){
            if(todos){
                todos = false
                algunos = true
            }
            selecthashmap[id] = null
        }
        else{
            if(ninguno){
                algunos = true
                ninguno =  false
            }
            let a = animales.filter(an=>an.id==id)[0]
            selecthashmap[id] = {
                ...a
            }
        }
    }
    function clickTodos(){
        if(todos){
            todos = false
            ninguno = true
            algunos = false
            selecthashmap = {}
        }
        else if(ninguno){
            ninguno = false
            todos = true
            for(let i = 0;i<animalesrows.length;i++){
                let a = animalesrows[i]
                selecthashmap[animalesrows[i].id] = {
                    ...a
                }
            }
        }
        else if (algunos){
            selecthashmap = {}
            algunos = false
            todos = false
            ninguno = true
        }
        
    }
    function inputObsGeneral(){
        
        for(let i = 0 ;i < selectanimales.length;i++){
            selectanimales[i].observacionnuevo = observaciongeneral
            
        }
    }
    async function getLotes(){
        const records = await pb.collection('lotes').getFullList({
            filter:`active = true && cab ~ '${cab.id}'`,
            sort: 'nombre',
        });
        lotes = records
        ordenarNombre(lotes)
    }
    async function getRodeos(){
        const records = await pb.collection('rodeos').getFullList({
            filter:`active = true && cab ~ '${cab.id}'`,
            sort: 'nombre',
        });
        rodeos = records
        //ordenarNombre(rodeos)
    }
    async function getTiposTratamientos(){
        const records = await pb.collection('tipotratamientos').getFullList({
            filter : `(cab='${cab.id}' || generico = true) && active = true`,
            sort: '-created',
        });
        tipotratamientos = records
        tipotratamientos.sort((tp1,tp2)=>tp1.nombre>tp2.nombre?1:-1)
    }
    async function getAnimales(){
        const recordsa = await pb.collection("animales").getFullList({
            filter:`active=true && delete=false && cab='${cab.id}'`,
            expand:"rodeo,lote"
        })
        
        animales = recordsa
        animales.sort((a1,a2)=>a1.caravana>a2.caravana?1:-1)
        animalesrows = animales
    }
    function openNewModal(){
        if(ninguno){
            Swal.fire("Error tratamiento","No hay animales seleccionados","error")
            return
        }
        selectanimales = []
        for (const [key, value ] of Object.entries(selecthashmap)) {
            if(value != null){
                selectanimales.push({
                    ...value,
                    tipotratamiento:"",
                    observacionnuevo:""})
            }
        }
        tratamientoMasivo.showModal()
    }
    async function guardarTratamiento(){
        if(fecha == "" || tipotratamientoselect == ""){
            Swal.fire("Error tratamientos","Debe seleccionar una fecha","error")
            return 
        }
        let errores = false
        for(let i = 0;i<selectanimales.length;i++){
            let tratamientoanimal = selectanimales[i]
            try{
                let datatratamiento = {
                    fecha : fecha+ " 03:00:00",
                    observacion:tratamientoanimal.observacionnuevo,
                    categoria:tratamientoanimal.categoria,
                    animal:tratamientoanimal.id,
                    tipo:tipotratamientoselect,
                    active : true,
                    cab:cab.id
                }
                const  record = await pb.collection("tratamientos").create(datatratamiento)
            }catch(err){
                console.error(err)
                errores = true
            }
        }
        if(errores){
            Swal.fire("Error tratamientos","Hubo algun error en algun tratamiento","error")
        }
        else{
            Swal.fire("Éxito tratamientos","Se lograron registrar todos los tratamientos","success")
        }
        fecha = ""
        malfecha = false
        maltipo = false
        tipotratamientoselect = ""
        botonhabilitado = false
        selecthashmap = {}
        selectanimales = []
    }
    onMount(async ()=>{
        await getAnimales()
        await getLotes()
        await getRodeos()
        await getTiposTratamientos()
        
    })

</script>
<Navbarr>
    <div class="grid grid-cols-2 mx-1 lg:mx-10 mt-1 w-11/12">
        <div>
            <button
                    class="bg-transparent border-none flex"
                    aria-label="volver"
                    onclick={()=>goto("/tratamientos")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 mt-1">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    <h1 class="text-2xl">
                        Tratamientos
                    </h1>
                </button>
            
        </div>
        <div class="flex gap-1 justify-end">
            <button class={`btn btn-primary rounded-lg ${estilos.btntext}`} data-theme="forest" onclick={()=>openNewModal()}>
                <span  class="text-xl">{capitalize("nuevo")}</span>
            </button>
            <button

                onclick={()=>goto("/tratamientos")}
                class={`
                    hidden
                    bg-transparent border rounded-lg focus:outline-none transition-colors duration-200
                    ${estilos.btnsecondary}
                    rounded-full
                    px-4 pt-2 pb-3
                `} 
                aria-label="Exportar"
            >
                <span  class="text-xl font-semibold ">Volver</span>
                
            </button>
        </div>
        
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2  m-1 gap-2 lg:gap-10 mb-2 mt-1 mx-1 lg:mx-10" >
        <div class="w-11/12">
            <label class={`input input-bordered flex items-center gap-2 ${estilos.bgdark2}`}>
                <input type="text" class="grow" placeholder="Buscar..." bind:value={buscar} oninput={filterUpdate} />
            </label>
        </div>
    </div>
    <div class="w-11/12 m-1 mb-2 lg:mx-10 rounded-lg bg-transparent">
        <button 
            aria-label="Filtrar" 
            class="w-full"
            onclick={clickFilter}
        >
            <div class="flex justify-between items-center px-1">
                <h2 class="font-semibold text-xl py-2">Filtros</h2>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class={`h-5 w-5 transition-all duration-300 ${isOpenFilter? 'transform rotate-180':''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </button>
        <div class="flex justify-between items-center px-1">
            <h3 class=" text-md py-2">Animales seleccionados: {Object.keys(selecthashmap).length}</h3>
        </div>
        {#if isOpenFilter}
        <div transition:slide class="grid grid-cols-2 lg:grid-cols-4  m-1 gap-2 w-11/12" >
            <div>
                <label for = "sexo" class="label">
                    <span class="label-text text-base">Sexo</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2}
                        `}
                        bind:value={sexo}
                        onchange={filterUpdate}
                    >
                            <option value="">Todos</option>
                            {#each sexos as s}
                                <option value={s.id}>{s.nombre}</option>
                            {/each}
                    </select>
                </label>
            </div>
            <div>
                <label for = "rodeos" class="label">
                    <span class="label-text text-base">Rodeos</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            rounded-md
                            focus:outline-none 
                            focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} 
                        bind:value={rodeo}
                        onchange={filterUpdate}
                    >
                            <option value="">Todos</option>
                            {#each rodeos as r}
                                <option value={r.id}>{r.nombre}</option>    
                            {/each}
                    </select>
                </label>
            </div>
            <div>
                <label for = "rodeos" class="label">
                    <span class="label-text text-base">Lotes</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            rounded-md
                            focus:outline-none 
                            focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} 
                        bind:value={lote}
                        onchange={filterUpdate}
                    >
                            <option value="">Todos</option>
                            {#each lotes as r}
                                <option value={r.id}>{r.nombre}</option>    
                            {/each}
                    </select>
                </label>
            </div>
            <div>
                <label for = "rodeos" class="label">
                    <span class="label-text text-base">Categorias</span>
                </label>
                <label class="input-group ">
                    <select 
                        class={`
                            select select-bordered w-full
                            rounded-md
                            focus:outline-none 
                            focus:ring-2 
                            focus:ring-green-500 focus:border-green-500
                            ${estilos.bgdark2}
                        `} 
                        bind:value={categoria}
                        onchange={filterUpdate}
                    >
                            <option value="">Todos</option>
                            {#each categorias as r}
                                <option value={r.id}>{r.nombre}</option>    
                            {/each}
                    </select>
                </label>
            </div>
            <button class="btn btn-neutral" onclick={limpiar}>
                Limpiar
            </button>
            
        
        </div>
        {/if}
    </div>
    <div class="w-full grid grid-cols-1 justify-items-center mx-1 lg:mx-10 lg:w-11/12 overflow-x-auto" >
        <table class="table table-lg w-full " >
            <thead>
                <tr>
                    <th class="px-1 py-0 m-0">
                        <button    
                            aria-label="Todos"
                            onclick={clickTodos}
                            class={`
                                text-base bg-transparent rounded-lg
                                px-3 py-3 text-base
                                ${estilos.secundario}
                            `}
                        >
                            {#if todos}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {/if}
                            {#if ninguno}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {/if}
                            {#if algunos}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>      
                            {/if}                        
                          
                        </button>
                    </th>
                    <th class="text-base mx-1 px-1 ">Caravana</th>
                    <th class="text-base mx-1 px-1">Categoria</th>
                    <th class="text-base mx-1 px-1">Peso</th>
                    <th class="text-base mx-1 px-1">Rodeo</th>
                    <th class="text-base mx-1 px-1">Lote</th>
                    
                </tr>
            </thead>
            <tbody>
                {#each animalesrows as a}
                    <tr>
                        <td class="px-1 py-0 m-0">
                            <button
                                aria-label="fila"
                                onclick={()=>clickAnimal(a.id)}
                                class={`
                                    font-medium bg-transparent rounded-lg
                                    px-3 py-3 text-base
                                    ${selecthashmap[a.id]?estilos.danger:estilos.primario}
                                `}
                            >
                                {#if selecthashmap[a.id]}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>                                  
                                {:else}             
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                {/if}
                            </button>
                        </td>
                        <td class="text-base mx-1 px-0">{a.caravana}</td>
                        <td class="text-base mx-1 px-0">{a.categoria}</td>
                        <td class="text-base mx-1 px-0">{a.peso}</td>
                        <td class="text-base mx-1 px-0">{a.expand?.rodeo?.nombre||''}</td>
                        <td class="text-base mx-1 px-0">{a.expand?.lote?.nombre||''}</td>
                        
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</Navbarr>
<dialog id="tratamientoMasivo" class="modal modal-middle rounded-xl">
    <div 
        class="
            modal-box w-11/12 max-w-6xl
            bg-gradient-to-br from-white to-gray-100 
            dark:from-gray-900 dark:to-gray-800
            "
    >
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 rounded-xl">✕</button>
        </form>
        <h3 class="text-lg font-bold">Tratamientos</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div>
                <label for = "fechatrata" class="label">
                    <span class="label-text text-base">Fecha </span>
                </label>
                <label class="input-group ">
                    <input id ="fechtrata" type="date" max={HOY}  
                        class={`
                            input input-bordered w-full
                            border border-gray-300 rounded-md
                            focus:outline-none focus:ring-2 
                            focus:ring-green-500 
                            focus:border-green-500
                            ${estilos.bgdark2} 
                        `}
                        bind:value={fecha}
                        onchange={
                            ()=>{
                                if(fecha == ""){
                                    malfecha = true
                                    botonhabilitado = false
                                }
                                else{
                                    malfecha = false
                                    if(!maltipo && tipotratamientoselect !=""){
                                        botonhabilitado = true
                                    }
                                    
                                }
                            }
                        }
                    />
                    {#if malfecha}
                        <div class="label">
                            <span class="label-text-alt text-red-500">Debe seleccionar la fecha del tratamiento</span>                    
                        </div>
                    {/if}
                </label>
            </div>
            <div>
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
                        bind:value={tipotratamientoselect}
                        onchange={
                            ()=>{
                                if(tipotratamientoselect == ""){
                                    maltipo = true
                                    
                                    botonhabilitado = false
                                }
                                else{
                                    maltipo = false
                                    if(!malfecha && fecha != ""){
                                        botonhabilitado = true
                                    }
                                    
                                }
                            }
                        }
                    >
                        {#each tipotratamientos as t}
                            <option value={t.id}>{t.nombre}</option>    
                        {/each}
                    </select>
                    <div class={`label ${maltipo?"":"hidden"}`}>
                        <span class="label-text-alt text-red-400">Debe seleccionar un tipo</span>
                    </div>
                </label>
            </div>
            <div>
                <label for = "obs" class="label">
                    <span class="label-text text-base">Observación </span>
                </label>
                <input 
                    id ="obs" 
                    type="text"  
                    class={`
                        input 
                        input-bordered 
                        border border-gray-300 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                        w-full
                        ${estilos.bgdark2}
                    `}
                    bind:value={observaciongeneral}
                    oninput={inputObsGeneral}
                />
            </div>
        </div>
        <div class="w-full grid grid-cols-1 justify-items-start " >
            <div class="flex overflow-x-auto">
                <table class="table table-lg w-full" >
                    <thead>
                        <tr>
                            
                            <th class="text-base ">Caravana</th>
                            <th class="text-base ">Categoria</th>
                            <th class="text-base ">Observación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each selectanimales as a,i}
                            <tr>
                                <td class="text-base">{a.caravana}</td>
                                <td class="text-base">{a.categoria}</td>
                                <td class="">
                                    <input
                                    bind:value={selectanimales[i].observacionnuevo}
                                    class={`
                                        px-1
                                        h-12 border border-gray-300 
                                        w-full
                                        rounded-md
                                        focus:outline-none focus:ring-2 
                                        focus:ring-green-500 
                                        focus:border-green-500
                                        ${estilos.bgdark2}
                                    `}
                                    />
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table> 
            </div>
        </div>
        <div class="modal-action justify-start ">
            <form method="dialog" >
                <button class="btn btn-success text-white" disabled={!botonhabilitado} onclick={guardarTratamiento} >Crear tratamientos</button>
                <button class="btn btn-error text-white" >Cancelar</button>
            </form>
        </div>
    </div>
</dialog>